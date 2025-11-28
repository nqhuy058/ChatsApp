import mongoose, { Schema } from "mongoose";
const friendRequestSchema = new Schema({
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
}, {
    timestamps: true,
    collection: "friendrequests",
});
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
friendRequestSchema.index({ to: 1 });
const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;
