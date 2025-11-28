import mongoose, { Schema } from "mongoose";
const notificationSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["friend_request", "friend_accept", "message", "group_invite", "group_message"],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
    collection: "notifications",
});
// Index để query nhanh
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
