import mongoose, { Schema } from "mongoose";
const reactionSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    emoji: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    _id: false,
});
const messageSchema = new Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isRecall: {
        type: Boolean,
        default: false
    },
    content: {
        type: String,
        trim: true,
    },
    imgUrl: {
        type: String,
    },
    reactions: {
        type: [reactionSchema],
        default: [],
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    },
}, {
    timestamps: true,
    collection: "messages",
});
messageSchema.index({ conversationId: 1, createdAt: -1 });
const Message = mongoose.model("Message", messageSchema);
export default Message;
