import { Document, Types } from "mongoose";

/**
 * Interface định nghĩa structure của Notification document
 */
export interface INotification extends Document {
  userId: Types.ObjectId; // Người nhận thông báo
  type: "friend_request" | "friend_accept" | "message" | "group_invite" | "group_message";
  title: string;
  content: string;
  relatedId?: Types.ObjectId; // ID liên quan (friendRequestId, conversationId, messageId, etc.)
  relatedUser?: Types.ObjectId; // User liên quan (người gửi request, người nhắn tin, etc.)
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
