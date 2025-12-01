import Message from "../models/Message";
import Conversation from "../models/Convesation";
import mongoose from "mongoose";
import { io } from "../server"; // Import từ server hoặc file socket config
import { emitNewMessage, emitMessageUpdated, emitMessageRecalled } from "../libs/socket";
import { USER_POPULATE_FIELDS_MINIMAL } from "../utils/constants";
const EDIT_TIME_LIMIT = 15 * 60 * 100000; // 15 phút
/**
 * Lấy tin nhắn trong một conversation
 */
const getMessages = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        // ... (logic phân trang và kiểm tra quyền giữ nguyên)
        const { conversationId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 50);
        const before = req.query.before;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            res.status(400).json({ message: "conversationId không hợp lệ" });
            return;
        }
        const conversation = await Conversation.findById(conversationId).select("participants");
        if (!conversation) {
            res.status(404).json({ message: "Không tìm thấy conversation" });
            return;
        }
        const isMember = conversation.participants.some(p => p.userId.toString() === req.user._id.toString());
        if (!isMember) {
            res.status(403).json({ message: "Bạn không có quyền truy cập" });
            return;
        }
        const query = { conversationId: new mongoose.Types.ObjectId(conversationId) };
        if (before && mongoose.Types.ObjectId.isValid(before)) {
            const beforeMessage = await Message.findById(before);
            if (beforeMessage) {
                query.createdAt = { $lt: beforeMessage.createdAt };
            }
        }
        const skip = (page - 1) * limit;
        const [messagesFromDb, total] = await Promise.all([
            Message.find(query)
                .populate("sender", USER_POPULATE_FIELDS_MINIMAL) // SỬA: populate 'sender'
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Message.countDocuments(query)
        ]);
        // XÓA BỎ: logic chuyển đổi thủ công không còn cần thiết nữa
        res.status(200).json({
            message: "Thành công",
            messages: messagesFromDb, // Trả về trực tiếp
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    }
    catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Gửi tin nhắn mới (Đã tối ưu Notification)
 */
const sendMessage = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Chưa đăng nhập" });
        }
        const { conversationId: existingConvId, recipientId, content, imgUrl } = req.body;
        const sender = req.user._id; // SỬA: đổi tên biến cho nhất quán
        if (!content && !imgUrl) {
            return res.status(400).json({ message: "Tin nhắn phải có nội dung hoặc hình ảnh" });
        }
        // ... (logic tìm hoặc tạo conversation giữ nguyên) ...
        let conversation;
        if (existingConvId && mongoose.Types.ObjectId.isValid(existingConvId)) {
            conversation = await Conversation.findById(existingConvId);
            if (!conversation)
                return res.status(404).json({ message: "Không tìm thấy conversation" });
        }
        else if (recipientId && mongoose.Types.ObjectId.isValid(recipientId)) {
            if (sender.toString() === recipientId)
                return res.status(400).json({ message: "Không thể tự gửi tin nhắn cho chính mình" });
            const existingConversation = await Conversation.findOne({ type: 'direct', 'participants.userId': { $all: [sender, recipientId] } });
            if (existingConversation) {
                conversation = existingConversation;
            }
            else {
                conversation = await Conversation.create({ type: 'direct', participants: [{ userId: sender }, { userId: recipientId }] });
            }
        }
        if (!conversation)
            return res.status(400).json({ message: "Cần cung cấp conversationId hoặc recipientId hợp lệ" });
        const isMember = conversation.participants.some((p) => p.userId.toString() === sender.toString());
        if (!isMember)
            return res.status(403).json({ message: "Bạn không phải thành viên cuộc trò chuyện này" });
        const newMessage = new Message({
            conversationId: conversation._id,
            sender: sender, // SỬA: lưu vào trường 'sender'
            content: content || undefined,
            imgUrl: imgUrl || undefined,
        });
        const [savedMessage] = await Promise.all([
            newMessage.save(),
            Conversation.findByIdAndUpdate(conversation._id, { lastMessage: newMessage._id })
        ]);
        const populatedMessage = await savedMessage.populate("sender", USER_POPULATE_FIELDS_MINIMAL); // SỬA: populate 'sender'
        // XÓA BỎ: logic chuyển đổi thủ công không còn cần thiết nữa
        res.status(201).json({
            message: "Gửi tin nhắn thành công",
            newMessage: populatedMessage // Trả về trực tiếp
        });
        const participantIds = conversation.participants.map((p) => p.userId.toString());
        emitNewMessage(io, conversation._id.toString(), populatedMessage, participantIds);
    }
    catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Chỉnh sửa tin nhắn
 */
const editMessage = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const { messageId } = req.params;
        const { content } = req.body;
        // ... (logic kiểm tra content giữ nguyên) ...
        const message = await Message.findById(messageId);
        if (!message) {
            res.status(404).json({ message: "Không tìm thấy tin nhắn" });
            return;
        }
        if (message.sender.toString() !== req.user._id.toString()) { // SỬA: so sánh 'sender'
            res.status(403).json({ message: "Không có quyền chỉnh sửa" });
            return;
        }
        // ... (logic kiểm tra isRecall và thời gian giữ nguyên) ...
        message.content = content.trim();
        await message.save();
        await Conversation.updateOne({ _id: message.conversationId, "lastMessage._id": messageId }, { $set: { "lastMessage.content": content.trim() } });
        await message.populate("sender", USER_POPULATE_FIELDS_MINIMAL); // SỬA: populate 'sender'
        res.status(200).json({ message: "Sửa tin nhắn thành công", data: message });
        const conversation = await Conversation.findById(message.conversationId);
        if (conversation) {
            const receiverIds = conversation.participants.map(p => p.userId.toString());
            emitMessageUpdated(io, message.conversationId.toString(), message, receiverIds);
        }
    }
    catch (error) {
        console.error("Edit message error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Thu hồi tin nhắn
 */
const recallMessage = async (req, res) => {
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
        if (message.sender.toString() !== req.user._id.toString()) { // SỬA: so sánh 'sender'
            res.status(403).json({ message: "Không có quyền thu hồi" });
            return;
        }
        // ... (logic kiểm tra isRecall giữ nguyên) ...
        message.isRecall = true;
        await message.save();
        const latestMessage = await Message.findOne({
            conversationId: message.conversationId,
            isRecall: false
        }).sort({ createdAt: -1 });
        const updateData = {};
        if (latestMessage) {
            updateData.lastMessage = {
                _id: latestMessage._id.toString(),
                content: latestMessage.content,
                sender: latestMessage.sender, // SỬA: dùng 'sender'
                createdAt: latestMessage.createdAt
            };
            if (message.createdAt.getTime() > latestMessage.createdAt.getTime()) {
                updateData.lastMessageAt = latestMessage.createdAt;
            }
        }
        else {
            updateData.lastMessage = null;
        }
        const conversation = await Conversation.findByIdAndUpdate(message.conversationId, updateData, { new: true });
        res.status(200).json({ message: "Thu hồi thành công" });
        if (conversation) {
            const receiverIds = conversation.participants.map(p => p.userId.toString());
            emitMessageRecalled(io, message.conversationId.toString(), messageId, receiverIds);
        }
    }
    catch (error) {
        console.error("Recall error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Thêm/Xóa reaction (Sử dụng Atomic Update - Chống Race Condition)
 */
const toggleReaction = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        // ... (logic kiểm tra và tìm message giữ nguyên) ...
        const { messageId } = req.params;
        const { emoji } = req.body;
        const message = await Message.findById(messageId);
        if (!message) {
            res.status(404).json({ message: "Không tìm thấy tin nhắn" });
            return;
        }
        // ... (logic kiểm tra quyền và race condition giữ nguyên) ...
        const updatedMessage = await Message.findOneAndUpdate({ _id: messageId, "reactions": { $elemMatch: { userId: req.user._id, emoji: emoji } } }, { $pull: { "reactions": { userId: req.user._id, emoji: emoji } } }, { new: true });
        if (updatedMessage) {
            await updatedMessage.populate("sender", USER_POPULATE_FIELDS_MINIMAL); // SỬA: populate 'sender'
            res.status(200).json({ message: "Đã bỏ reaction", data: updatedMessage });
            // ... emit socket ...
            return;
        }
        const newMessage = await Message.findByIdAndUpdate(messageId, { $push: { reactions: { userId: req.user._id, emoji: emoji, createdAt: new Date() } } }, { new: true }).populate("sender", USER_POPULATE_FIELDS_MINIMAL); // SỬA: populate 'sender'
        if (!newMessage) {
            res.status(404).json({ message: "Không update được tin nhắn" });
            return;
        }
        res.status(200).json({ message: "Đã thả reaction", data: newMessage });
        // ... emit socket ...
    }
    catch (error) {
        console.error("Reaction error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Helper: Remove Vietnamese accents
 */
const removeVietnameseAccents = (str) => {
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
const searchMessages = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        // ... (logic lấy query và conversations của user giữ nguyên) ...
        const userConversations = await Conversation.find({ "participants.userId": req.user._id }).select('_id type group participants');
        const conversationIds = userConversations.map(c => c._id);
        // ... (logic tìm messages giữ nguyên) ...
        const messages = await Message.find({
            conversationId: { $in: conversationIds },
            isRecall: false,
            content: { $exists: true, $ne: "" }
        })
            .populate("sender", USER_POPULATE_FIELDS_MINIMAL) // SỬA: populate 'sender'
            .sort({ createdAt: -1 })
            .limit(50);
        // ... (logic filter và map giữ nguyên) ...
        const results = messages
            .filter(msg => msg.content && removeVietnameseAccents(msg.content).includes(removeVietnameseAccents(req.query.q || '')))
            .map(msg => {
            // ...
            return {
                //...
                senderId: msg.sender._id.toString(), // SỬA: lấy từ msg.sender
                senderName: msg.sender.display_name, // SỬA: lấy từ msg.sender
                createdAt: msg.createdAt
            };
        });
        res.status(200).json({ message: "Tìm kiếm thành công", results, total: results.length });
    }
    catch (error) {
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
