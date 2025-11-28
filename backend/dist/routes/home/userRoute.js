import express from "express";
import { userController } from "../../controllers/userController.js";
import { protectedRoute } from "../../middlewares/authMiddleware.js";
const router = express.Router();
// Protected routes - Cần đăng nhập
router.get('/me', protectedRoute, userController.getMe);
router.put('/update', protectedRoute, userController.updateProfile);
router.put('/change-password', protectedRoute, userController.changePassword);
// GET /api/users/search?q=term&limit=20 - Tìm kiếm users
router.get('/search', protectedRoute, userController.searchUsers);
// GET /api/users/:userId - Xem thông tin public của một user
router.get('/:userId', protectedRoute, userController.getUserById);
export default router;
