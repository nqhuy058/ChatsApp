import { Document, Types } from "mongoose";

/**
 * Interface cho participant trong conversation
 */
export interface IParticipant {
  userId: Types.ObjectId;
  joinedAt: Date;
}

/**
 * Interface cho group information
 */
export interface IGroup {
  name?: string;
  normalized_name?: string;
  createdBy?: Types.ObjectId;
  groupAvatar?: string;
  groupAvatarId?: string;
}

/**
 * Interface cho last message
 */
export interface ILastMessage {
  _id?: string;
  content?: string;
  senderId?: Types.ObjectId;
  createdAt?: Date;
}

/**
 * Interface định nghĩa structure của Conversation document
 */
export interface IConversation extends Document {
  type: "direct" | "group";
  participants: IParticipant[];
  group?: IGroup;
  lastMessageAt?: Date;
  seenBy: Types.ObjectId[];
  lastMessage?: ILastMessage | null;
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}
