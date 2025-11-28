import { Document, Types } from "mongoose";

/**
 * Interface định nghĩa structure của FriendRequest document
 */
export interface IFriendRequest extends Document {
  from: Types.ObjectId;
  to: Types.ObjectId;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}
