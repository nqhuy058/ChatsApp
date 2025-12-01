import { Document, Types } from "mongoose";
import { IUser } from "./user"; 
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
  // SỬA Ở ĐÂY: Đổi tên trường này và cho phép kiểu IUser khi populate
  sender: Types.ObjectId | IUser; 
  isRecall: boolean;
  content?: string;
  imgUrl?: string;
  reactions: IReaction[];
  replyTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

