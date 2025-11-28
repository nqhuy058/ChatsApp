import FriendRequest from "../models/FriendRequest";
import Friend from "../models/Friend";
import Conversation from "../models/Convesation";
import mongoose from "mongoose";
import { getIO } from "../server";
import { emitFriendRequestCancelled, emitFriendRequestDeclined, emitFriendRequestAccepted } from "../libs/socket";
import { USER_POPULATE_FIELDS } from "../utils/constants";
/**
 * Gửi lời mời kết bạn
 */
const sendFriendRequest = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const { toUserId, message } = req.body;
        // Validate input
        if (!toUserId || !mongoose.Types.ObjectId.isValid(toUserId)) {
            res.status(400).json({ message: "ID người nhận không hợp lệ" });
            return;
        }
        if (req.user._id.equals(toUserId)) {
            res.status(400).json({ message: "Không thể kết bạn với chính mình" });
            return;
        }
        // 1. Check quan hệ bạn bè
        const [userA, userB] = [req.user._id.toString(), toUserId].sort();
        const existingFriend = await Friend.findOne({
            userA: new mongoose.Types.ObjectId(userA),
            userB: new mongoose.Types.ObjectId(userB)
        });
        if (existingFriend) {
            res.status(400).json({ message: "Hai người đã là bạn bè" });
            return;
        }
        // 2. Check lời mời cũ
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { from: req.user._id, to: toUserId },
                { from: toUserId, to: req.user._id }
            ]
        });
        if (existingRequest) {
            const msg = existingRequest.from.equals(req.user._id)
                ? "Bạn đã gửi lời mời rồi"
                : "Người này đã gửi lời mời cho bạn, hãy chấp nhận nó";
            res.status(400).json({ message: msg });
            return;
        }
        // 3. Tạo lời mời
        const friendRequest = await FriendRequest.create({
            from: req.user._id,
            to: toUserId,
            message: message || "Xin chào, mình muốn kết bạn với bạn!"
        });
        // Populate để trả về đẹp
        await friendRequest.populate([
            { path: "from", select: "user_name display_name avatarURL bio" },
            { path: "to", select: "user_name display_name avatarURL bio" }
        ]);
        // 4. Gửi thông báo (Notification)
        // Import động để tránh lỗi Circular Dependency nếu notificationController cũng import file này
        try {
            const { createNotification } = await import("./notificationController");
            await createNotification(new mongoose.Types.ObjectId(toUserId), "friend_request", "Lời mời kết bạn mới", `${req.user.display_name} đã gửi lời mời kết bạn`, friendRequest._id, req.user._id);
        }
        catch (notiError) {
            console.error("Lỗi gửi thông báo:", notiError);
        }
        res.status(201).json({
            message: "Gửi lời mời thành công",
            friendRequest
        });
    }
    catch (error) {
        console.error("Send request error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Lấy danh sách lời mời đã gửi
 */
const getSentRequests = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const [requests, total] = await Promise.all([
            FriendRequest.find({ from: req.user._id })
                .populate("to", USER_POPULATE_FIELDS)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            FriendRequest.countDocuments({ from: req.user._id })
        ]);
        res.status(200).json({
            message: "Thành công",
            sentRequests: requests,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Lấy danh sách lời mời nhận được
 */
const getReceivedRequests = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const [requests, total] = await Promise.all([
            FriendRequest.find({ to: req.user._id })
                .populate("from", USER_POPULATE_FIELDS)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            FriendRequest.countDocuments({ to: req.user._id })
        ]);
        res.status(200).json({
            message: "Thành công",
            receivedRequests: requests,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Chấp nhận lời mời (Transaction an toàn)
 */
const acceptRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!req.user)
            throw new Error("UNAUTHORIZED");
        const { requestId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(requestId))
            throw new Error("INVALID_ID");
        // 1. Tìm request và lock nó lại (nếu cần, nhưng ở đây findById là đủ)
        const friendRequest = await FriendRequest.findById(requestId).session(session);
        if (!friendRequest)
            throw new Error("NOT_FOUND");
        if (!friendRequest.to.equals(req.user._id))
            throw new Error("FORBIDDEN");
        // 2. Tạo Friend Record
        const [userA, userB] = [friendRequest.from.toString(), friendRequest.to.toString()].sort();
        // Check duplicate friend lần cuối trong transaction
        const existingFriend = await Friend.findOne({
            userA: new mongoose.Types.ObjectId(userA),
            userB: new mongoose.Types.ObjectId(userB)
        }).session(session);
        if (existingFriend) {
            // Nếu đã là bạn rồi -> Xóa request rác này đi luôn
            await FriendRequest.findByIdAndDelete(requestId, { session });
            await session.commitTransaction();
            res.status(200).json({ message: "Hai người đã là bạn bè từ trước" });
            return;
        }
        const friend = await Friend.create([{
                userA: new mongoose.Types.ObjectId(userA),
                userB: new mongoose.Types.ObjectId(userB)
            }], { session });
        // 3. Xử lý Conversation (Tái sử dụng nếu có, tạo mới nếu chưa)
        let conversation = await Conversation.findOne({
            type: "direct",
            $and: [
                { "participants.userId": friendRequest.from },
                { "participants.userId": friendRequest.to }
            ]
        }).session(session);
        if (!conversation) {
            // Init unread map
            const unreadMap = new Map();
            unreadMap.set(friendRequest.from.toString(), 0);
            unreadMap.set(friendRequest.to.toString(), 0);
            const newConvos = await Conversation.create([{
                    type: "direct",
                    participants: [
                        { userId: friendRequest.from, joinedAt: new Date() },
                        { userId: friendRequest.to, joinedAt: new Date() }
                    ],
                    seenBy: [],
                    unreadCounts: unreadMap
                }], { session });
            conversation = newConvos[0];
        }
        // 4. Xóa lời mời
        await FriendRequest.findByIdAndDelete(requestId, { session });
        // COMMIT
        await session.commitTransaction();
        // 5. Gửi thông báo & Phản hồi (Ngoài transaction)
        try {
            const { createNotification } = await import("./notificationController");
            await createNotification(friendRequest.from, "friend_accept", "Đã chấp nhận kết bạn", `${req.user.display_name} đã đồng ý kết bạn`, friend[0]._id, req.user._id);
        }
        catch (e) {
            console.error(e);
        }
        // Populate để trả về thông tin đẹp
        await friend[0].populate([
            { path: "userA", select: USER_POPULATE_FIELDS },
            { path: "userB", select: USER_POPULATE_FIELDS }
        ]);
        // Emit socket event to both users
        const io = getIO();
        emitFriendRequestAccepted(io, requestId, friendRequest.from.toString(), friendRequest.to.toString());
        res.status(200).json({
            message: "Kết bạn thành công",
            friend: friend[0],
            conversation
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.error("Accept error:", error);
        const msg = error.message === "UNAUTHORIZED" ? "Chưa đăng nhập" :
            error.message === "FORBIDDEN" ? "Không có quyền" :
                error.message === "NOT_FOUND" ? "Không tìm thấy lời mời" : "Lỗi server";
        res.status(error.message === "Lỗi server" ? 500 : 400).json({ message: msg });
    }
    finally {
        session.endSession();
    }
};
/**
 * Từ chối lời mời kết bạn
 */
const declineRequest = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const { requestId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            res.status(400).json({ message: "requestId không hợp lệ" });
            return;
        }
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest) {
            res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
            return;
        }
        // Chỉ người nhận mới có thể từ chối
        if (friendRequest.to.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: "Bạn không có quyền từ chối lời mời này" });
            return;
        }
        const senderId = friendRequest.from.toString();
        await FriendRequest.findByIdAndDelete(requestId);
        // Emit socket event to notify sender
        const io = getIO();
        emitFriendRequestDeclined(io, requestId, senderId);
        res.status(200).json({ message: "Từ chối lời mời kết bạn thành công" });
    }
    catch (error) {
        console.error("Decline request error:", error);
        res.status(500).json({
            message: "Lỗi server",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
/**
 * Thu hồi lời mời đã gửi
 */
const cancelRequest = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Chưa đăng nhập" });
            return;
        }
        const { requestId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            res.status(400).json({ message: "requestId không hợp lệ" });
            return;
        }
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest) {
            res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
            return;
        }
        // Chỉ người gửi mới có thể thu hồi
        if (friendRequest.from.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: "Bạn không có quyền thu hồi lời mời này" });
            return;
        }
        const receiverId = friendRequest.to.toString();
        await FriendRequest.findByIdAndDelete(requestId);
        // Emit socket event to notify receiver
        const io = getIO();
        emitFriendRequestCancelled(io, requestId, receiverId);
        res.status(200).json({ message: "Thu hồi lời mời thành công" });
    }
    catch (error) {
        console.error("Cancel request error:", error);
        res.status(500).json({
            message: "Lỗi server",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
export const friendRequestController = {
    sendFriendRequest,
    getSentRequests,
    getReceivedRequests,
    acceptRequest,
    declineRequest,
    cancelRequest
};
