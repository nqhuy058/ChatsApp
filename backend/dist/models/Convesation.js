import mongoose, { Schema } from "mongoose";
const participantSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    _id: false,
});
const groupSchema = new Schema({
    name: {
        type: String,
        trim: true,
    },
    normalized_name: {
        type: String,
        select: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    groupAvatar: {
        type: String,
    },
    groupAvatarId: {
        type: String,
    },
}, {
    _id: false,
});
const lastMessageSchema = new Schema({
    _id: { type: String },
    content: {
        type: String,
        default: null,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: null,
    },
}, {
    _id: false,
});
const conversationSchema = new Schema({
    type: {
        type: String,
        enum: ["direct", "group"],
        required: true,
    },
    participants: {
        type: [participantSchema],
        required: true,
    },
    group: {
        type: groupSchema,
    },
    lastMessageAt: {
        type: Date,
    },
    seenBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    lastMessage: {
        type: lastMessageSchema,
        default: null,
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {},
    },
}, {
    timestamps: true,
    collection: "conversations",
});
// Indexes
conversationSchema.index({
    "participants.userId": 1,
    lastMessageAt: -1,
});
conversationSchema.index({ "group.normalized_name": 1 });
// Helper function
const removeVietnameseAccents = (str) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
};
// Pre-save hook: Tự động tạo normalized_name cho group
conversationSchema.pre('save', function () {
    if (this.type === 'group' && this.group?.name && this.isModified('group.name')) {
        if (!this.group.normalized_name || this.isModified('group.name')) {
            this.group.normalized_name = removeVietnameseAccents(this.group.name);
        }
    }
});
// Pre findOneAndUpdate hook
conversationSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function () {
    const update = this.getUpdate();
    if (update.$set?.['group.name']) {
        update.$set['group.normalized_name'] = removeVietnameseAccents(update.$set['group.name']);
    }
    else if (update['group.name']) {
        if (!update.$set)
            update.$set = {};
        update.$set['group.normalized_name'] = removeVietnameseAccents(update['group.name']);
    }
});
const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
