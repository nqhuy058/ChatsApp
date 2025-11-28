import { v2 as cloudinary } from "cloudinary";
import Conversation from "../models/Convesation";
// Hàm config Cloudinary (gọi khi cần thiết)
const configureCloudinary = () => {
    if (!cloudinary.config().cloud_name) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            timeout: 60000 // Tăng timeout lên 60s
        });
    }
};
/**
 * Upload avatar user
 */
const uploadAvatar = async (req, res) => {
    try {
        configureCloudinary();
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "Không có file được upload" });
            return;
        }
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!allowedTypes.includes(req.file.mimetype)) {
            res.status(400).json({ message: "Chỉ chấp nhận file ảnh (jpg, jpeg, png, webp)" });
            return;
        }
        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
            res.status(400).json({ message: "Kích thước file không được vượt quá 5MB" });
            return;
        }
        // Xóa ảnh cũ nếu có
        if (req.user.avatarID) {
            try {
                await cloudinary.uploader.destroy(req.user.avatarID);
            }
            catch (error) {
                console.error("Error deleting old avatar:", error);
                // Không throw error, tiếp tục upload ảnh mới
            }
        }
        // Upload lên Cloudinary với timeout
        const uploadResult = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Upload timeout sau 60 giây'));
            }, 60000);
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "chat_app/avatars",
                transformation: [
                    { width: 400, height: 400, crop: "fill", gravity: "face" }
                ],
                timeout: 60000
            }, (error, result) => {
                clearTimeout(timeoutId);
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            uploadStream.end(req.file.buffer);
        });
        // Update user với avatar mới
        req.user.avatarURL = uploadResult.secure_url;
        req.user.avatarID = uploadResult.public_id;
        await req.user.save();
        res.status(200).json({
            message: "Upload avatar thành công",
            avatarURL: uploadResult.secure_url
        });
    }
    catch (error) {
        console.error("Upload avatar error:", error);
        res.status(500).json({
            message: "Lỗi server khi upload avatar",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
/**
 * Upload ảnh cho tin nhắn
 */
const uploadMessageImage = async (req, res) => {
    try {
        configureCloudinary();
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "Không có file được upload" });
            return;
        }
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];
        if (!allowedTypes.includes(req.file.mimetype)) {
            res.status(400).json({ message: "Chỉ chấp nhận file ảnh (jpg, jpeg, png, webp, gif)" });
            return;
        }
        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (req.file.size > maxSize) {
            res.status(400).json({ message: "Kích thước file không được vượt quá 10MB" });
            return;
        }
        // Upload lên Cloudinary với timeout
        const uploadResult = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Upload timeout sau 60 giây'));
            }, 60000);
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "chat_app/messages",
                transformation: [
                    { width: 1200, height: 1200, crop: "limit" }
                ],
                timeout: 60000
            }, (error, result) => {
                clearTimeout(timeoutId);
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            uploadStream.end(req.file.buffer);
        });
        res.status(200).json({
            message: "Upload ảnh thành công",
            imgUrl: uploadResult.secure_url,
            imgId: uploadResult.public_id
        });
    }
    catch (error) {
        console.error("Upload message image error:", error);
        res.status(500).json({
            message: "Lỗi server khi upload ảnh",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
/**
 * Upload ảnh đại diện nhóm
 */
const uploadGroupAvatar = async (req, res) => {
    try {
        configureCloudinary();
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const { conversationId } = req.body;
        if (!conversationId) {
            res.status(400).json({ message: "conversationId là bắt buộc" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "Không có file được upload" });
            return;
        }
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!allowedTypes.includes(req.file.mimetype)) {
            res.status(400).json({ message: "Chỉ chấp nhận file ảnh (jpg, jpeg, png, webp)" });
            return;
        }
        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
            res.status(400).json({ message: "Kích thước file không được vượt quá 5MB" });
            return;
        }
        // Kiểm tra conversation
        const mongoose = (await import("mongoose")).default;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            res.status(400).json({ message: "conversationId không hợp lệ" });
            return;
        }
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            res.status(404).json({ message: "Không tìm thấy conversation" });
            return;
        }
        if (conversation.type !== "group") {
            res.status(400).json({ message: "Chỉ có thể upload avatar cho nhóm chat" });
            return;
        }
        // Kiểm tra user có phải là member không
        const isMember = conversation.participants.some(p => p.userId.toString() === req.user._id.toString());
        if (!isMember) {
            res.status(403).json({ message: "Bạn không có quyền truy cập nhóm này" });
            return;
        }
        // Xóa ảnh cũ nếu có
        if (conversation.group?.groupAvatarId) {
            try {
                await cloudinary.uploader.destroy(conversation.group.groupAvatarId);
            }
            catch (error) {
                console.error("Error deleting old group avatar:", error);
            }
        }
        // Upload lên Cloudinary với timeout
        const uploadResult = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Upload timeout sau 60 giây'));
            }, 60000);
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "chat_app/group_avatars",
                transformation: [
                    { width: 400, height: 400, crop: "fill" }
                ],
                timeout: 60000
            }, (error, result) => {
                clearTimeout(timeoutId);
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            uploadStream.end(req.file.buffer);
        });
        // Update conversation
        if (conversation.group) {
            conversation.group.groupAvatar = uploadResult.secure_url;
            conversation.group.groupAvatarId = uploadResult.public_id;
            await conversation.save();
        }
        res.status(200).json({
            message: "Upload ảnh nhóm thành công",
            groupAvatarURL: uploadResult.secure_url
        });
    }
    catch (error) {
        console.error("Upload group avatar error:", error);
        res.status(500).json({
            message: "Lỗi server khi upload ảnh nhóm",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
export const uploadController = {
    uploadAvatar,
    uploadMessageImage,
    uploadGroupAvatar
};
