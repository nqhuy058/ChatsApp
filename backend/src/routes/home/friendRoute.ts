import express, { Router } from "express";
import { friendController } from "../../controllers/friendController";
import { protectedRoute } from "../../middlewares/authMiddleware";

const router: Router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(protectedRoute);

// GET /api/friends - Lấy danh sách bạn bè
router.get('/', friendController.getFriends);

// GET /api/friends/check/:userId - Kiểm tra quan hệ bạn bè với một user
router.get('/check/:userId', friendController.checkFriendship);

// DELETE /api/friends/:friendId - Hủy kết bạn
router.delete('/:friendId', friendController.unfriend);

export default router;
