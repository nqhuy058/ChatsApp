import { Document, Types } from "mongoose";

/**
 * Interface định nghĩa structure của Friend document
 */
export interface IFriend extends Document {
  userA: Types.ObjectId;
  userB: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
