import express from "express";
import { friendRequestController } from "../../controllers/friendRequestController";
import { protectedRoute } from "../../middlewares/authMiddleware";
const router = express.Router();
// Tất cả routes đều cần đăng nhập
router.use(protectedRoute);
// POST /api/friend-requests/send - Gửi lời mời kết bạn
router.post('/send', friendRequestController.sendFriendRequest);
// GET /api/friend-requests/sent - Lấy danh sách lời mời đã gửi
router.get('/sent', friendRequestController.getSentRequests);
// GET /api/friend-requests/received - Lấy danh sách lời mời nhận được
router.get('/received', friendRequestController.getReceivedRequests);
// POST /api/friend-requests/:requestId/accept - Chấp nhận lời mời
router.post('/:requestId/accept', friendRequestController.acceptRequest);
// POST /api/friend-requests/:requestId/decline - Từ chối lời mời
router.post('/:requestId/decline', friendRequestController.declineRequest);
// DELETE /api/friend-requests/:requestId/cancel - Thu hồi lời mời đã gửi
router.delete('/:requestId/cancel', friendRequestController.cancelRequest);
export default router;
