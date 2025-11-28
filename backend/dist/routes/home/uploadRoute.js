import express from "express";
import { uploadController } from "../../controllers/uploadController";
import { protectedRoute } from "../../middlewares/authMiddleware";
import multer from "multer";
const router = express.Router();
// Cấu hình multer để lưu file vào memory
const storage = multer.memoryStorage();
const upload = multer({ storage });
// Tất cả routes đều cần đăng nhập
router.use(protectedRoute);
// POST /api/upload/avatar - Upload avatar user
router.post('/avatar', upload.single('avatar'), uploadController.uploadAvatar);
// POST /api/upload/message-image - Upload ảnh cho tin nhắn
router.post('/message-image', upload.single('image'), uploadController.uploadMessageImage);
// POST /api/upload/group-avatar - Upload ảnh đại diện nhóm
router.post('/group-avatar', upload.single('avatar'), uploadController.uploadGroupAvatar);
export default router;
