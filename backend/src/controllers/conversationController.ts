import { Response } from "express";
import { AuthRequest } from "../types/express";
import Conversation from "../models/Convesation";
import Friend from "../models/Friend";
import Message from "../models/Message";
import mongoose from "mongoose";
import { USER_POPULATE_FIELDS, USER_POPULATE_FIELDS_MINIMAL } from "../utils/constants";

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
 * Lấy danh sách conversations
 */
const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string; // "direct" | "group" | undefined
    const search = req.query.search as string; // Search query
    const skip = (page - 1) * limit;

    // Query để tìm conversations mà user là participant
    const query: any = {
      "participants.userId": req.user._id
    };

    // Filter theo type nếu có
    if (type && (type === "direct" || type === "group")) {
      query.type = type;
    }

    // Search filter (chỉ áp dụng cho group conversations)
    if (search && search.trim()) {
      const normalizedSearch = removeVietnameseAccents(search.trim());
      query.$and = [
        { type: 'group' },
        { 'group.normalized_name': { $regex: normalizedSearch, $options: 'i' } }
      ];
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .populate("participants.userId", USER_POPULATE_FIELDS_MINIMAL)
        .populate("lastMessage.senderId", USER_POPULATE_FIELDS_MINIMAL)
        .populate("group.createdBy", USER_POPULATE_FIELDS_MINIMAL)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit),
      Conversation.countDocuments(query)
    ]);

    // Tính unread count cho mỗi conversation
    const conversationsWithUnread = conversations.map(conv => {
      const unreadCount = conv.unreadCounts.get(req.user!._id.toString()) || 0;

      return {
        ...conv.toObject(),
        unreadCount
      };
    });

    res.status(200).json({
      message: "Lấy danh sách conversations thành công",
      conversations: conversationsWithUnread,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Lấy chi tiết một conversation
 */
const getConversationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "conversationId không hợp lệ" });
      return;
    }

    const conversation = await Conversation.findById(conversationId)
      .populate("participants.userId", USER_POPULATE_FIELDS)
      .populate("lastMessage.senderId", USER_POPULATE_FIELDS_MINIMAL)
      .populate("group.createdBy", USER_POPULATE_FIELDS_MINIMAL);

    if (!conversation) {
      res.status(404).json({ message: "Không tìm thấy conversation" });
      return;
    }

    // Kiểm tra user có phải là member không
    const isMember = conversation.participants.some(
      p => p.userId._id.toString() === req.user!._id.toString()
    );

    if (!isMember) {
      res.status(403).json({ message: "Bạn không có quyền truy cập conversation này" });
      return;
    }

    const unreadCount = conversation.unreadCounts.get(req.user._id.toString()) || 0;

    res.status(200).json({
      message: "Lấy chi tiết conversation thành công",
      conversation: {
        ...conversation.toObject(),
        unreadCount
      }
    });
  } catch (error) {
    console.error("Get conversation by id error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Tạo hoặc lấy conversation trực tiếp với một user
 */
const getOrCreateDirectConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "userId không hợp lệ" });
      return;
    }

    if (req.user._id.equals(userId)) {
      res.status(400).json({ message: "Không thể tạo conversation với chính mình" });
      return;
    }

    // Kiểm tra bạn bè
    const [userA, userB] = [req.user._id.toString(), userId].sort();
    const friendship = await Friend.findOne({
      userA: new mongoose.Types.ObjectId(userA),
      userB: new mongoose.Types.ObjectId(userB)
    });

    if (!friendship) {
      res.status(400).json({ message: "Phải là bạn bè mới có thể chat" });
      return;
    }

    // Tìm conversation cũ
    let conversation = await Conversation.findOne({
      type: "direct",
      "participants.userId": { $all: [req.user._id, userId] }
    })
      .populate("participants.userId", USER_POPULATE_FIELDS_MINIMAL)
      .populate("lastMessage.senderId", USER_POPULATE_FIELDS_MINIMAL);

    if (!conversation) {
      // Init unread map cho cả 2 người
      const unreadMap = new Map();
      unreadMap.set(req.user._id.toString(), 0);
      unreadMap.set(userId.toString(), 0);

      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: req.user._id },
          { userId: new mongoose.Types.ObjectId(userId) }
        ],
        seenBy: [],
        unreadCounts: unreadMap
      });

      await conversation.populate("participants.userId", USER_POPULATE_FIELDS_MINIMAL);
    }

    // Lấy unread count an toàn
    const unreadCount = conversation.unreadCounts?.get(req.user._id.toString()) || 0;

    res.status(200).json({
      message: "Thành công",
      conversation: {
        ...conversation.toObject(),
        unreadCount
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Đánh dấu conversation đã đọc
 */
const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "conversationId không hợp lệ" });
      return;
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({ message: "Không tìm thấy conversation" });
      return;
    }

    // Kiểm tra user có phải là member không
    const isMember = conversation.participants.some(
      p => p.userId.toString() === req.user!._id.toString()
    );

    if (!isMember) {
      res.status(403).json({ message: "Bạn không có quyền truy cập conversation này" });
      return;
    }

    // Add user vào seenBy nếu chưa có
    if (!conversation.seenBy.some(id => id.toString() === req.user!._id.toString())) {
      conversation.seenBy.push(req.user._id);
    }

    // Reset unread count
    conversation.unreadCounts.set(req.user._id.toString(), 0);

    await conversation.save();

    res.status(200).json({ message: "Đánh dấu đã đọc thành công" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Xóa hoặc rời conversation
 */
const deleteOrLeaveConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "conversationId không hợp lệ" });
      return;
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({ message: "Không tìm thấy conversation" });
      return;
    }

    // Kiểm tra user có phải là member không
    const isMember = conversation.participants.some(
      p => p.userId.toString() === req.user!._id.toString()
    );

    if (!isMember) {
      res.status(403).json({ message: "Bạn không có quyền truy cập conversation này" });
      return;
    }

    if (conversation.type === "direct") {
      // Direct: Xóa hoàn toàn conversation và messages
      await Message.deleteMany({ conversationId: conversation._id });
      await Conversation.findByIdAndDelete(conversationId);

      res.status(200).json({ message: "Xóa conversation thành công" });
    } else {
      // Group: Rời nhóm (remove khỏi participants)
      conversation.participants = conversation.participants.filter(
        p => p.userId.toString() !== req.user!._id.toString()
      );

      // Nếu không còn ai trong nhóm, xóa conversation
      if (conversation.participants.length === 0) {
        await Message.deleteMany({ conversationId: conversation._id });
        await Conversation.findByIdAndDelete(conversationId);
        res.status(200).json({ message: "Nhóm đã bị giải tán" });
        return;
      }

      await conversation.save();
      res.status(200).json({ message: "Rời nhóm thành công" });
    }
  } catch (error) {
    console.error("Delete or leave conversation error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Tạo nhóm chat mới
 */
const createGroupConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { name, participantIds } = req.body;

    // 1. Validate Input cơ bản
    if (!name || !name.trim()) {
      res.status(400).json({ message: "Tên nhóm là bắt buộc" });
      return;
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
      res.status(400).json({ message: "Cần chọn ít nhất 2 thành viên khác để tạo nhóm" });
      return;
    }

    // 2. Chuẩn bị dữ liệu
    // Map Unread Counts: Rất quan trọng, phải khởi tạo = 0 cho tất cả thành viên
    const unreadMap = new Map<string, number>();
    unreadMap.set(req.user._id.toString(), 0); // Init cho Creator (mình)

    const participants = [
      {
        userId: req.user._id,
        joinedAt: new Date(),
        // lastSeenAt: new Date() // Có thể thêm nếu model đã update
      },
    ];

    // 3. Validate từng thành viên được mời
    for (const id of participantIds) {
      // Bỏ qua nếu ID lỗi hoặc là chính mình
      if (!mongoose.Types.ObjectId.isValid(id)) continue;
      if (id === req.user._id.toString()) continue;

      // 3.1. Kiểm tra quan hệ bạn bè
      // Logic: Sắp xếp ID để match với cách lưu trong DB (userA < userB)
      const [userA, userB] = [req.user._id.toString(), id].sort();

      const friendship = await Friend.findOne({
        userA: new mongoose.Types.ObjectId(userA),
        userB: new mongoose.Types.ObjectId(userB)
      });

      if (!friendship) {
        res.status(400).json({
          message: `Không thể thêm người dùng có ID ${id} vì chưa là bạn bè`
        });
        return;
      }

      // 3.2. Thêm vào danh sách tham gia
      participants.push({
        userId: new mongoose.Types.ObjectId(id),
        joinedAt: new Date()
      });

      // 3.3. Init unread count cho thành viên này
      unreadMap.set(id.toString(), 0);
    }

    // 4. Tạo Conversation trong DB
    const conversation = await Conversation.create({
      type: "group",
      participants,
      group: {
        name: name.trim(),
        createdBy: req.user._id,
        // groupAvatarUrl: ... (Nếu sau này có upload ảnh nhóm thì thêm vào đây)
      },
      seenBy: [req.user._id], // Creator coi như đã xem
      unreadCounts: unreadMap, // <--- Đã fix lỗi logic tại đây
      lastMessageAt: new Date()
    });

    // 5. Populate thông tin để trả về Frontend hiển thị ngay
    await conversation.populate([
      {
        path: "participants.userId",
        select: "user_name display_name avatarURL"
      },
      {
        path: "group.createdBy",
        select: "display_name avatarURL"
      }
    ]);

    // 6. Gửi thông báo (Notification)
    // Lưu ý: Import động để tránh Circular Dependency nếu file notificationController cũng import conversation
    try {
      const { createNotification } = await import("./notificationController"); // Hoặc đường dẫn đúng của bạn
      const groupName = name.trim();

      // Loop gửi noti cho từng member (trừ mình)
      // Có thể dùng Promise.all để nhanh hơn nếu muốn
      const notificationPromises = participantIds.map((participantId: string) => {
        if (participantId === req.user!._id.toString()) return;

        return createNotification(
          new mongoose.Types.ObjectId(participantId),
          "group_invite",
          "Được thêm vào nhóm mới",
          `${req.user!.display_name} đã thêm bạn vào nhóm "${groupName}"`,
          conversation._id,
          req.user!._id
        );
      });

      await Promise.all(notificationPromises);

    } catch (notiError) {
      console.error("Lỗi gửi thông báo nhóm:", notiError);
      // Không return lỗi ở đây, vì nhóm đã tạo thành công rồi
    }

    res.status(201).json({
      message: "Tạo nhóm thành công",
      conversation
    });

  } catch (error) {
    console.error("Create group conversation error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Đổi tên nhóm
 */
const updateGroupName = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { conversationId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: "Tên nhóm không được rỗng" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "conversationId không hợp lệ" });
      return;
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({ message: "Không tìm thấy conversation" });
      return;
    }

    if (conversation.type !== "group") {
      res.status(400).json({ message: "Chỉ có thể đổi tên nhóm chat" });
      return;
    }

    // Kiểm tra user có phải là member không
    const isMember = conversation.participants.some(
      p => p.userId.toString() === req.user!._id.toString()
    );

    if (!isMember) {
      res.status(403).json({ message: "Bạn không có quyền truy cập nhóm này" });
      return;
    }

    // Update group name
    if (conversation.group) {
      conversation.group.name = name.trim();
    }

    await conversation.save();

    res.status(200).json({
      message: "Đổi tên nhóm thành công",
      conversation
    });
  } catch (error) {
    console.error("Update group name error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Thêm hoặc xóa thành viên khỏi nhóm
 */
const addGroupMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { conversationId } = req.params;
    const { userIds, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ message: "userIds là bắt buộc và phải là mảng" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "conversationId không hợp lệ" });
      return;
    }

    // Nếu action là 'remove', xóa thành viên
    if (action === 'remove') {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        res.status(404).json({ message: "Không tìm thấy conversation" });
        return;
      }

      if (conversation.type !== "group") {
        res.status(400).json({ message: "Chỉ có thể xóa thành viên khỏi nhóm chat" });
        return;
      }

      const isMember = conversation.participants.some(
        p => p.userId.toString() === req.user!._id.toString()
      );

      if (!isMember) {
        res.status(403).json({ message: "Bạn không có quyền truy cập nhóm này" });
        return;
      }

      // Remove members
      conversation.participants = conversation.participants.filter(
        p => !userIds.includes(p.userId.toString())
      );

      if (conversation.participants.length === 0) {
        await Message.deleteMany({ conversationId: conversation._id });
        await Conversation.findByIdAndDelete(conversationId);
        res.status(200).json({ message: "Nhóm đã bị giải tán" });
        return;
      }

      await conversation.save();
      await conversation.populate("participants.userId", USER_POPULATE_FIELDS_MINIMAL);

      res.status(200).json({ message: "Xóa thành viên thành công", conversation });
      return;
    }

    // Default: Add members

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ message: "userIds là bắt buộc và phải là mảng" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ message: "conversationId không hợp lệ" });
      return;
    }

    // Validate tất cả userIds
    for (const id of userIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: `userId ${id} không hợp lệ` });
        return;
      }
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({ message: "Không tìm thấy conversation" });
      return;
    }

    if (conversation.type !== "group") {
      res.status(400).json({ message: "Chỉ có thể thêm thành viên vào nhóm chat" });
      return;
    }

    // Kiểm tra user hiện tại có phải là member không
    const isMember = conversation.participants.some(
      p => p.userId.toString() === req.user!._id.toString()
    );

    if (!isMember) {
      res.status(403).json({ message: "Bạn không có quyền truy cập nhóm này" });
      return;
    }

    // Kiểm tra tất cả userIds phải là bạn bè của user hiện tại
    for (const userId of userIds) {
      const [userA, userB] = [req.user._id.toString(), userId].sort();
      const friendship = await Friend.findOne({
        userA: new mongoose.Types.ObjectId(userA),
        userB: new mongoose.Types.ObjectId(userB)
      });

      if (!friendship) {
        res.status(400).json({ message: "Chỉ có thể thêm bạn bè vào nhóm" });
        return;
      }

      // Kiểm tra user đã có trong nhóm chưa
      const alreadyInGroup = conversation.participants.some(
        p => p.userId.toString() === userId
      );

      if (alreadyInGroup) {
        res.status(400).json({ message: `User ${userId} đã có trong nhóm` });
        return;
      }
    }

    // Thêm members vào nhóm
    const newParticipants = userIds.map((id: string) => ({
      userId: new mongoose.Types.ObjectId(id),
      joinedAt: new Date()
    }));

    conversation.participants.push(...newParticipants);
    await conversation.save();

    await conversation.populate("participants.userId", USER_POPULATE_FIELDS_MINIMAL);

    // Tạo thông báo cho các thành viên mới
    const { createNotification } = await import("./notificationController.js");
    const groupName = conversation.group?.name || "nhóm";
    for (const userId of userIds) {
      await createNotification(
        new mongoose.Types.ObjectId(userId),
        "group_invite",
        "Được thêm vào nhóm",
        `${req.user!.display_name} đã thêm bạn vào nhóm "${groupName}"`,
        conversation._id,
        req.user!._id
      );
    }

    res.status(200).json({
      message: "Thêm thành viên thành công",
      conversation
    });
  } catch (error) {
    console.error("Add group members error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Xóa thành viên khỏi nhóm hoặc tự rời nhóm
 */
const removeGroupMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { conversationId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "conversationId hoặc userId không hợp lệ" });
      return;
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({ message: "Không tìm thấy conversation" });
      return;
    }

    if (conversation.type !== "group") {
      res.status(400).json({ message: "Chỉ có thể xóa thành viên khỏi nhóm chat" });
      return;
    }

    // Kiểm tra user hiện tại có phải là member không
    const isMember = conversation.participants.some(
      p => p.userId.toString() === req.user!._id.toString()
    );

    if (!isMember) {
      res.status(403).json({ message: "Bạn không có quyền truy cập nhóm này" });
      return;
    }

    // Case 1: Tự rời nhóm
    if (userId === req.user._id.toString()) {
      conversation.participants = conversation.participants.filter(
        p => p.userId.toString() !== userId
      );

      // Nếu không còn ai, xóa nhóm
      if (conversation.participants.length === 0) {
        await Message.deleteMany({ conversationId: conversation._id });
        await Conversation.findByIdAndDelete(conversationId);
        res.status(200).json({ message: "Nhóm đã bị giải tán" });
        return;
      }

      await conversation.save();
      res.status(200).json({ message: "Rời nhóm thành công" });
      return;
    }

    // Case 2: Kick member - Chỉ creator mới được kick
    if (!conversation.group?.createdBy || conversation.group.createdBy.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Chỉ trưởng nhóm mới có thể xóa thành viên" });
      return;
    }

    // Không thể kick chính mình (dùng leave thay vì kick)
    if (userId === req.user._id.toString()) {
      res.status(400).json({ message: "Không thể tự kick chính mình, hãy dùng tính năng rời nhóm" });
      return;
    }

    // Remove member
    conversation.participants = conversation.participants.filter(
      p => p.userId.toString() !== userId
    );

    await conversation.save();

    res.status(200).json({ message: "Xóa thành viên thành công" });
  } catch (error) {
    console.error("Remove group member error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const conversationController = {
  getConversations,
  getConversationById,
  getOrCreateDirectConversation,
  markAsRead,
  deleteOrLeaveConversation,
  createGroupConversation,
  updateGroupName,
  addGroupMembers,
  removeGroupMember
};
