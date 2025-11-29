import { Response } from "express";
import { AuthRequest } from "../types/express";
import Message from "../models/Message";
import Conversation from "../models/Convesation";
import mongoose from "mongoose";
import { io } from "../server"; // Import từ server hoặc file socket config
import { emitNewMessage, emitMessageUpdated, emitMessageRecalled } from "../libs/socket";
import { USER_POPULATE_FIELDS_MINIMAL } from "../utils/constants";

const EDIT_TIME_LIMIT = 15 * 60 * 1000; // 15 phút

/**
 * Lấy tin nhắn trong một conversation
 */
const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { conversationId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 50);
    const before = req.query.before as string; // messageId làm mốc cursor

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "conversationId không hợp lệ" });
      return;
    }

    // Kiểm tra quyền thành viên (Query nhẹ chỉ lấy field participants)
    const conversation = await Conversation.findById(conversationId).select("participants");

    if (!conversation) {
      res.status(404).json({ message: "Không tìm thấy conversation" });
      return;
    }

    const isMember = conversation.participants.some(
      p => p.userId.toString() === req.user!._id.toString()
    );

    if (!isMember) {
      res.status(403).json({ message: "Bạn không có quyền truy cập" });
      return;
    }

    // Build query
    const query: any = {
      conversationId: new mongoose.Types.ObjectId(conversationId)
    };

    // Cursor-based pagination (Hiệu năng cao hơn skip/limit thuần túy)
    if (before && mongoose.Types.ObjectId.isValid(before)) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate("senderId", USER_POPULATE_FIELDS_MINIMAL)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments(query) // Lưu ý: Với chat app lớn, countDocuments có thể chậm, nên cache hoặc ước lượng
    ]);

    res.status(200).json({
      message: "Thành công",
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Gửi tin nhắn mới (Đã tối ưu Notification)
 */
const sendMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const { conversationId: existingConvId, recipientId, content, imgUrl } = req.body;
    const senderId = req.user._id;

    if (!content && !imgUrl) {
      return res.status(400).json({ message: "Tin nhắn phải có nội dung hoặc hình ảnh" });
    }

    let conversation: any;

    if (existingConvId && mongoose.Types.ObjectId.isValid(existingConvId)) {
      conversation = await Conversation.findById(existingConvId);
      if (!conversation) {
        return res.status(404).json({ message: "Không tìm thấy conversation" });
      }
    }
    else if (recipientId && mongoose.Types.ObjectId.isValid(recipientId)) {
      if (senderId.toString() === recipientId) {
        return res.status(400).json({ message: "Không thể tự gửi tin nhắn cho chính mình" });
      }

      const existingConversation = await Conversation.findOne({
        type: 'direct',
        'participants.userId': { $all: [senderId, recipientId] },
      });

      if (existingConversation) {
        conversation = existingConversation;
      } else {
        conversation = await Conversation.create({
          type: 'direct',
          participants: [
            { userId: senderId },
            { userId: recipientId }
          ],
          lastMessage: null,
        });
      }
    }

    if (!conversation) {
      return res.status(400).json({ message: "Cần cung cấp conversationId hoặc recipientId hợp lệ" });
    }

    const isMember = conversation.participants.some(
      (p: any) => p.userId.toString() === senderId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Bạn không phải thành viên cuộc trò chuyện này" });
    }

    // --- BỎ TRANSACTION ---
    // 1. Tạo Message mới
    const newMessage = new Message({
      conversationId: conversation._id,
      senderId: senderId,
      content: content || undefined,
      imgUrl: imgUrl || undefined,
    });

    // 2. Lưu tin nhắn và cập nhật conversation song song để tăng tốc
    const [savedMessage, updatedConversation] = await Promise.all([
      newMessage.save(),
      Conversation.findByIdAndUpdate(conversation._id, { lastMessage: newMessage._id })
    ]);

    // 3. Populate và Trả về Client
    const populatedMessage = await savedMessage.populate("senderId", USER_POPULATE_FIELDS_MINIMAL);

    res.status(201).json({
      message: "Gửi tin nhắn thành công",
      data: populatedMessage
    });

    // 4. Xử lý Socket
    const participantIds = conversation.participants.map((p: any) => p.userId.toString());
    emitNewMessage(io, conversation._id.toString(), populatedMessage, participantIds);

  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};


/**
 * Chỉnh sửa tin nhắn
 */
const editMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ message: "Nội dung không được rỗng" });
      return;
    }

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json({ message: "Không tìm thấy tin nhắn" });
      return;
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Không có quyền chỉnh sửa" });
      return;
    }

    if (message.isRecall) {
      res.status(400).json({ message: "Không thể sửa tin nhắn đã thu hồi" });
      return;
    }

    // Check time limit 15p
    if (new Date().getTime() - message.createdAt.getTime() > EDIT_TIME_LIMIT) {
      res.status(400).json({ message: "Đã quá thời gian chỉnh sửa (15 phút)" });
      return;
    }

    message.content = content.trim();
    // Nên thêm field isEdited để hiển thị UI "Đã chỉnh sửa"
    // (message as any).isEdited = true; 
    await message.save();

    // Update Conversation lastMessage nếu trùng
    // Dùng updateOne để nhẹ db hơn là findById -> save
    await Conversation.updateOne(
      { _id: message.conversationId, "lastMessage._id": messageId },
      { $set: { "lastMessage.content": content.trim() } }
    );

    await message.populate("senderId", USER_POPULATE_FIELDS_MINIMAL);

    res.status(200).json({ message: "Sửa tin nhắn thành công", data: message });

    // Emit socket - lấy conversation để có receiverIds
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const receiverIds = conversation.participants.map(p => p.userId.toString());
      emitMessageUpdated(io, message.conversationId.toString(), message, receiverIds);
    }

  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Thu hồi tin nhắn
 */
const recallMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404).json({ message: "Không tìm thấy tin nhắn" });
      return;
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Không có quyền thu hồi" });
      return;
    }

    if (message.isRecall) {
      res.status(400).json({ message: "Tin nhắn đã được thu hồi rồi" });
      return;
    }

    message.isRecall = true;
    await message.save();

    // Logic tìm tin nhắn mới nhất để update conversation
    // Tìm tin nhắn mới nhất mà KHÔNG phải là tin nhắn vừa recall (và chưa bị recall)
    const latestMessage = await Message.findOne({
      conversationId: message.conversationId,
      isRecall: false
    }).sort({ createdAt: -1 });

    const updateData: any = {};
    if (latestMessage) {
      updateData.lastMessage = {
        _id: latestMessage._id.toString(),
        content: latestMessage.content,
        senderId: latestMessage.senderId,
        createdAt: latestMessage.createdAt
      };
      // Nếu tin nhắn bị recall chính là tin mới nhất, thì lùi thời gian lại
      if (message.createdAt.getTime() > latestMessage.createdAt.getTime()) {
        updateData.lastMessageAt = latestMessage.createdAt;
      }
    } else {
      // Không còn tin nhắn nào khả dụng
      updateData.lastMessage = null;
    }

    const conversation = await Conversation.findByIdAndUpdate(message.conversationId, updateData, { new: true });

    res.status(200).json({ message: "Thu hồi thành công" });

    // Emit socket
    if (conversation) {
      const receiverIds = conversation.participants.map(p => p.userId.toString());
      emitMessageRecalled(io, message.conversationId.toString(), messageId, receiverIds);
    }

  } catch (error) {
    console.error("Recall error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Thêm/Xóa reaction (Sử dụng Atomic Update - Chống Race Condition)
 */
const toggleReaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({ message: "Thiếu emoji" });
      return;
    }

    // Check quyền truy cập conversation
    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json({ message: "Không tìm thấy tin nhắn" });
      return;
    }

    if (message.isRecall) {
      res.status(400).json({ message: "Không thể thả tim tin đã thu hồi" });
      return;
    }

    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation?.participants.some(p => p.userId.toString() === req.user!._id.toString())) {
      res.status(403).json({ message: "Không có quyền truy cập" });
      return;
    }

    const userId = req.user._id;

    // 1. Thử XÓA reaction nếu đã tồn tại (Toggle Off)
    // Sử dụng $pull để xóa nguyên tử
    const updatedMessage = await Message.findOneAndUpdate(
      {
        _id: messageId,
        "reactions": { $elemMatch: { userId: userId, emoji: emoji } }
      },
      {
        $pull: { "reactions": { userId: userId, emoji: emoji } }
      },
      { new: true } // Trả về doc sau khi update
    );

    if (updatedMessage) {
      // Nếu xóa thành công -> Trả về luôn (Unlike)
      await updatedMessage.populate("senderId", USER_POPULATE_FIELDS_MINIMAL);
      res.status(200).json({ message: "Đã bỏ reaction", data: updatedMessage });

      // Emit socket
      const conversation = await Conversation.findById(message.conversationId);
      if (conversation) {
        const receiverIds = conversation.participants.map(p => p.userId.toString());
        emitMessageUpdated(io, message.conversationId.toString(), updatedMessage, receiverIds);
      }
      return;
    }

    // 2. Nếu chưa có -> THÊM reaction (Toggle On)
    // Sử dụng $push để thêm nguyên tử
    const newMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $push: {
          reactions: {
            userId: userId,
            emoji: emoji,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate("senderId", USER_POPULATE_FIELDS_MINIMAL);

    if (!newMessage) {
      res.status(404).json({ message: "Không update được tin nhắn" });
      return;
    }

    res.status(200).json({ message: "Đã thả reaction", data: newMessage });

    // Emit socket
    const conv = await Conversation.findById(message.conversationId);
    if (conv) {
      const receiverIds = conv.participants.map(p => p.userId.toString());
      emitMessageUpdated(io, message.conversationId.toString(), newMessage, receiverIds);
    }
  } catch (error) {
    console.error("Reaction error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Helper: Remove Vietnamese accents
 */
const removeVietnameseAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

/**
 * Tìm kiếm messages trong tất cả conversations của user
 */
const searchMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const q = req.query.q as string || "";
    const limit = parseInt(req.query.limit as string) || 50;

    if (!q || q.trim().length === 0) {
      res.status(400).json({ message: "Từ khóa tìm kiếm không được rỗng" });
      return;
    }

    // Tìm các conversations mà user là participant
    const userConversations = await Conversation.find({
      "participants.userId": req.user._id
    }).select('_id type group participants');

    const conversationIds = userConversations.map(c => c._id);

    if (conversationIds.length === 0) {
      res.status(200).json({
        message: "Tìm kiếm thành công",
        results: [],
        total: 0
      });
      return;
    }

    // Normalize query
    const normalizedQuery = removeVietnameseAccents(q);

    // Tìm messages trong các conversations đó
    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      isRecall: false,
      content: { $exists: true, $ne: "" }
    })
      .populate("senderId", USER_POPULATE_FIELDS_MINIMAL)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Filter client-side với normalized content
    const filteredMessages = messages.filter(msg => {
      if (!msg.content) return false;
      const normalizedContent = removeVietnameseAccents(msg.content);
      return normalizedContent.includes(normalizedQuery);
    });

    // Map kèm thông tin conversation
    const results = filteredMessages.map(msg => {
      const conversation = userConversations.find(
        c => c._id.toString() === msg.conversationId.toString()
      );

      let conversationName = "Unknown";
      let conversationAvatar = undefined;

      if (conversation) {
        if (conversation.type === 'group') {
          conversationName = conversation.group?.name || "Nhóm";
          conversationAvatar = conversation.group?.groupAvatar;
        } else {
          // Direct chat - lấy tên người còn lại
          const otherParticipant = conversation.participants.find(
            p => p.userId.toString() !== req.user!._id.toString()
          );
          if (otherParticipant) {
            // Populate sẽ được làm sau
            conversationName = "Direct Chat";
          }
        }
      }

      return {
        conversationId: msg.conversationId.toString(),
        conversationName,
        conversationAvatar,
        messageId: msg._id.toString(),
        content: msg.content,
        senderId: (msg.senderId as any)._id.toString(),
        senderName: (msg.senderId as any).display_name,
        createdAt: msg.createdAt
      };
    });

    res.status(200).json({
      message: "Tìm kiếm thành công",
      results,
      total: results.length
    });
  } catch (error) {
    console.error("Search messages error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const messageController = {
  getMessages,
  sendMessage,
  editMessage,
  recallMessage,
  toggleReaction,
  searchMessages
};