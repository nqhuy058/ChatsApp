import { Document, Types } from "mongoose";

/**
 * Interface cho reaction trên message
 */
export interface IReaction {
  userId: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

/**
 * Interface định nghĩa structure của Message document
 */
export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  isRecall: boolean;
  content?: string;
  imgUrl?: string;
  reactions: IReaction[];
  replyTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
