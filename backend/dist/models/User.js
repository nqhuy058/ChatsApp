import mongoose, { Schema } from "mongoose";
//Schema cho User collection
const userSchema = new Schema({
    user_name: {
        type: String,
        required: [true, "Username là bắt buộc"],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, "Username phải có ít nhất 3 ký tự"],
        maxlength: [30, "Username không được quá 30 ký tự"],
    },
    email: {
        type: String,
        required: [true, "Email là bắt buộc"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    hash_password: {
        type: String,
        required: [true, "Password là bắt buộc"],
        minlength: [6, "Password phải có ít nhất 6 ký tự"],
    },
    display_name: {
        type: String,
        required: [true, "Display name là bắt buộc"],
        trim: true,
        maxlength: [50, "Display name không được quá 50 ký tự"],
    },
    normalized_display_name: {
        type: String,
        select: false, // Không trả về mặc định
    },
    sessions: [
        {
            refreshToken: { type: String, required: true },
            userAgent: String,
            ip: String,
            createdAt: { type: Date, default: Date.now },
            expiresAt: { type: Date, required: true },
            lastUsedAt: Date,
            _id: false,
        }
    ],
    avatarURL: { type: String, default: null },
    avatarID: { type: String, default: null },
    bio: {
        type: String,
        maxlength: [500, "Bio không được quá 500 ký tự"],
        default: "",
    },
    phone: {
        type: String,
        sparse: true,
        match: [/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"],
    },
    status: {
        type: String,
        enum: ["online", "offline", "away"],
        default: "offline",
    },
    lastSeen: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordOTPExpires: { type: Date, default: null },
}, {
    timestamps: true,
    collection: "users",
});
// Indexes
userSchema.index({ normalized_display_name: 1 });
// Pre-save hook: Tự động tạo normalized_display_name
userSchema.pre('save', function () {
    if (this.isModified('display_name')) {
        this.normalized_display_name = this.display_name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase();
    }
});
// Pre findOneAndUpdate hook: Đảm bảo normalized_display_name được update
userSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function () {
    const update = this.getUpdate();
    // Nếu có update display_name, tự động tính normalized_display_name
    if (update.$set?.display_name) {
        update.$set.normalized_display_name = update.$set.display_name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase();
    }
    else if (update.display_name) {
        if (!update.$set)
            update.$set = {};
        update.$set.normalized_display_name = update.display_name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase();
    }
});
//Methods - Các phương thức instance
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.hash_password;
    return user;
};
// Method để tự động lọc bỏ session hết hạn (Thay thế cho TTL Index)
userSchema.methods.removeExpiredSessions = async function () {
    const now = new Date();
    // Lọc giữ lại những session chưa hết hạn
    this.sessions = this.sessions.filter((session) => session.expiresAt > now);
    return this.save();
};
//Export User model
const User = mongoose.model("User", userSchema);
export default User;
