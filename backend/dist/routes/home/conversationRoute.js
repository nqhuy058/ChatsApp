import express from "express";
import { conversationController } from "../../controllers/conversationController";
import { protectedRoute } from "../../middlewares/authMiddleware";
const router = express.Router();
// Tất cả routes đều cần đăng nhập
router.use(protectedRoute);
// GET /api/conversations - Lấy danh sách conversations
router.get('/', conversationController.getConversations);
// GET /api/conversations/:conversationId - Lấy chi tiết conversation
router.get('/:conversationId', conversationController.getConversationById);
// POST /api/conversations/direct - Tạo hoặc lấy conversation direct
router.post('/direct', conversationController.getOrCreateDirectConversation);
// POST /api/conversations/group - Tạo nhóm chat
router.post('/group', conversationController.createGroupConversation);
// PUT /api/conversations/:conversationId/group-name - Đổi tên nhóm
router.put('/:conversationId/group-name', conversationController.updateGroupName);
// PUT /api/conversations/:conversationId/members - Thêm/Xóa thành viên
router.put('/:conversationId/members', conversationController.addGroupMembers);
// POST /api/conversations/:conversationId/mark-read - Đánh dấu đã đọc
router.post('/:conversationId/mark-read', conversationController.markAsRead);
// DELETE /api/conversations/:conversationId - Xóa/Rời conversation
router.delete('/:conversationId', conversationController.deleteOrLeaveConversation);
export default router;
