import mongoose, { Schema } from "mongoose";
import { IFriendRequest } from "../types/modelsType/friendRequest";

const friendRequestSchema = new Schema<IFriendRequest>(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
    collection: "friendrequests",
  }
);

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

friendRequestSchema.index({ to: 1 });

const FriendRequest = mongoose.model<IFriendRequest>("FriendRequest", friendRequestSchema);
export default FriendRequest;