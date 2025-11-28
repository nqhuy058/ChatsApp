import express, { Router } from "express";
import { notificationController } from "../../controllers/notificationController";
import { protectedRoute } from "../../middlewares/authMiddleware";

const router: Router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(protectedRoute);

// GET /api/notifications - Lấy danh sách thông báo
router.get('/', notificationController.getNotifications);

// PUT /api/notifications/:notificationId/read - Đánh dấu một thông báo đã đọc
router.put('/:notificationId/read', notificationController.markAsRead);

// PUT /api/notifications/:notificationId/unread - Đánh dấu một thông báo chưa đọc
router.put('/:notificationId/unread', notificationController.markAsUnread);

// PUT /api/notifications/read-all - Đánh dấu tất cả đã đọc
router.put('/read-all', notificationController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Xóa thông báo
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;
