import User from "../models/User";
// Lấy thông tin user hiện tại (đã đăng nhập)
const getMe = async (req, res) => {
    try {
        // req.user được set bởi protectedRoute middleware
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        // Giờ có thể truy cập req.user._id, req.user.email, etc.
        res.status(200).json({
            message: "Lấy thông tin thành công",
            user: await User.findById(req.user._id).select("-hash_password -sessions")
        });
    }
    catch (error) {
        console.error("Lỗi khi gọi authMe:", error);
        res.status(500).json({
            message: "Lỗi server",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
/**
 * Cập nhật profile user
 */
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const { display_name, bio, phone } = req.body;
        // Cập nhật thông tin
        req.user.display_name = display_name || req.user.display_name;
        req.user.bio = bio || req.user.bio;
        req.user.phone = phone || req.user.phone;
        await req.user.save();
        res.status(200).json({
            message: "Cập nhật thành công",
            user: req.user
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            message: "Lỗi server",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
/**
 * Đổi mật khẩu (user đã đăng nhập)
 */
const changePassword = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) {
            res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
            return;
        }
        if (new_password.length < 6) {
            res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
            return;
        }
        // Import bcrypt
        const bcrypt = (await import("bcrypt")).default;
        // Kiểm tra mật khẩu cũ
        const isValidPassword = await bcrypt.compare(old_password, req.user.hash_password);
        if (!isValidPassword) {
            res.status(401).json({ message: "Mật khẩu cũ không đúng" });
            return;
        }
        // Hash mật khẩu mới
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
        req.user.hash_password = await bcrypt.hash(new_password, saltRounds);
        await req.user.save();
        res.status(200).json({ message: "Đổi mật khẩu thành công" });
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            message: "Lỗi server",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
/**
 * Helper: Remove Vietnamese accents
 */
const removeVietnameseAccents = (str) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
};
/**
 * Tìm kiếm users theo username hoặc display_name
 */
const searchUsers = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const q = req.query.q || "";
        const limit = parseInt(req.query.limit) || 20;
        if (!q || q.trim().length === 0) {
            res.status(400).json({ message: "Từ khóa tìm kiếm không được rỗng" });
            return;
        }
        // Normalize query để tìm cả có dấu và không dấu
        const normalizedQuery = removeVietnameseAccents(q);
        // Tìm kiếm theo user_name hoặc display_name (bao gồm cả normalized)
        const users = await User.find({
            $and: [
                { _id: { $ne: req.user._id } }, // Không hiển thị chính mình
                {
                    $or: [
                        { user_name: { $regex: normalizedQuery, $options: "i" } },
                        { normalized_display_name: { $regex: normalizedQuery, $options: "i" } }
                    ]
                }
            ]
        })
            .select("user_name display_name avatarURL bio status lastSeen")
            .limit(limit);
        // Import models
        const Friend = (await import("../models/Friend.js")).default;
        const FriendRequest = (await import("../models/FriendRequest.js")).default;
        // Thêm trạng thái cho mỗi user
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            // Check xem đã là bạn chưa
            const [userA, userB] = [req.user._id.toString(), user._id.toString()].sort();
            const friendship = await Friend.findOne({
                userA: new (await import("mongoose")).default.Types.ObjectId(userA),
                userB: new (await import("mongoose")).default.Types.ObjectId(userB)
            });
            if (friendship) {
                return {
                    ...user.toObject(),
                    relationshipStatus: 'friend'
                };
            }
            // Check xem đã gửi lời mời chưa
            const sentRequest = await FriendRequest.findOne({
                from: req.user._id,
                to: user._id
            });
            if (sentRequest) {
                return {
                    ...user.toObject(),
                    relationshipStatus: 'sent',
                    requestId: sentRequest._id.toString()
                };
            }
            // Check xem có nhận lời mời từ user này không
            const receivedRequest = await FriendRequest.findOne({
                from: user._id,
                to: req.user._id
            });
            if (receivedRequest) {
                return {
                    ...user.toObject(),
                    relationshipStatus: 'received',
                    requestId: receivedRequest._id.toString()
                };
            }
            // Chưa có quan hệ gì
            return {
                ...user.toObject(),
                relationshipStatus: 'none'
            };
        }));
        res.status(200).json({
            message: "Tìm kiếm thành công",
            users: usersWithStatus,
            total: usersWithStatus.length
        });
    }
    catch (error) {
        console.error("Search users error:", error);
        res.status(500).json({
            message: "Lỗi server",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
/**
 * Xem thông tin public của một user
 */
const getUserById = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const { userId } = req.params;
        const mongoose = (await import("mongoose")).default;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            res.status(400).json({ message: "userId không hợp lệ" });
            return;
        }
        const user = await User.findById(userId).select("user_name display_name avatarURL bio status lastSeen createdAt");
        if (!user) {
            res.status(404).json({ message: "Không tìm thấy user" });
            return;
        }
        res.status(200).json({
            message: "Lấy thông tin user thành công",
            user
        });
    }
    catch (error) {
        console.error("Get user by id error:", error);
        res.status(500).json({
            message: "Lỗi server",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
export const userController = {
    getMe,
    updateProfile,
    changePassword,
    searchUsers,
    getUserById
};
