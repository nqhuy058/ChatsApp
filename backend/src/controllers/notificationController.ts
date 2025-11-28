import { Response } from "express";
import { AuthRequest } from "../types/express";
import Notification from "../models/Notification";
import mongoose from "mongoose";
import { io } from "../server.js";
import { emitNotification } from "../libs/socket.js";
import { USER_POPULATE_FIELDS_MINIMAL } from "../utils/constants";

/**
 * Lấy danh sách thông báo
 */
const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unread = req.query.unread === "true";
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId: req.user._id };
    if (unread) {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("relatedUser", USER_POPULATE_FIELDS_MINIMAL)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);

    res.status(200).json({
      message: "Lấy danh sách thông báo thành công",
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Đánh dấu một thông báo đã đọc
 */
const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({ message: "notificationId không hợp lệ" });
      return;
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      res.status(404).json({ message: "Không tìm thấy thông báo" });
      return;
    }

    // Chỉ owner mới có thể mark as read
    if (notification.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Bạn không có quyền truy cập thông báo này" });
      return;
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: "Đánh dấu đã đọc thành công" });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Đánh dấu một thông báo chưa đọc
 */
const markAsUnread = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({ message: "notificationId không hợp lệ" });
      return;
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      res.status(404).json({ message: "Không tìm thấy thông báo" });
      return;
    }

    // Chỉ owner mới có thể mark as unread
    if (notification.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Bạn không có quyền truy cập thông báo này" });
      return;
    }

    notification.isRead = false;
    await notification.save();

    res.status(200).json({ message: "Đánh dấu chưa đọc thành công" });
  } catch (error) {
    console.error("Mark notification as unread error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: "Đánh dấu tất cả đã đọc thành công" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Xóa thông báo
 */
const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa đăng nhập" });
      return;
    }

    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      res.status(400).json({ message: "notificationId không hợp lệ" });
      return;
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      res.status(404).json({ message: "Không tìm thấy thông báo" });
      return;
    }

    // Chỉ owner mới có thể xóa
    if (notification.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: "Bạn không có quyền xóa thông báo này" });
      return;
    }

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({ message: "Xóa thông báo thành công" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Helper function: Tạo thông báo mới (dùng trong các controller khác)
 */
export const createNotification = async (
  userId: mongoose.Types.ObjectId,
  type: "friend_request" | "friend_accept" | "message" | "group_invite" | "group_message",
  title: string,
  content: string,
  relatedId?: mongoose.Types.ObjectId,
  relatedUser?: mongoose.Types.ObjectId
): Promise<void> => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      content,
      relatedId,
      relatedUser,
      isRead: false
    });

    // Populate relatedUser before emitting
    await notification.populate("relatedUser", USER_POPULATE_FIELDS_MINIMAL);

    // Emit WebSocket event
    emitNotification(io, userId.toString(), notification);
  } catch (error) {
    console.error("Create notification error:", error);
    // Không throw error để không ảnh hưởng đến main flow
  }
};

export const notificationController = {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification
};
