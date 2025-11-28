import express from "express";
import { messageController } from "../../controllers/messageController";
import { protectedRoute } from "../../middlewares/authMiddleware";
const router = express.Router();
// Tất cả routes đều cần đăng nhập
router.use(protectedRoute);
// GET /api/messages/search - Tìm kiếm tin nhắn (phải đặt trước /:conversationId)
router.get('/search', messageController.searchMessages);
// GET /api/messages/:conversationId - Lấy tin nhắn trong conversation
router.get('/:conversationId', messageController.getMessages);
// POST /api/messages/send - Gửi tin nhắn mới
router.post('/send', messageController.sendMessage);
// PUT /api/messages/:messageId/edit - Chỉnh sửa tin nhắn
router.put('/:messageId/edit', messageController.editMessage);
// DELETE /api/messages/:messageId/recall - Thu hồi tin nhắn
router.delete('/:messageId/recall', messageController.recallMessage);
// POST /api/messages/:messageId/react - Thêm/Xóa reaction
router.post('/:messageId/react', messageController.toggleReaction);
export default router;
