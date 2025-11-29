import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User.js";
import { AuthRequest } from "../types/express.js";
import dotenv from 'dotenv';

dotenv.config();

export const protectedRoute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers["authorization"];

    // Kiểm tra định dạng "Bearer <token>"
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    // 2. Verify token (Dùng try-catch thay vì callback để code phẳng hơn)
    const secret = process.env.ACCESS_TOKEN_SECRET!;

    // Nếu verify lỗi, nó sẽ tự nhảy xuống catch
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // 3. Tìm user trong DB
    // Lưu ý: Sửa '-hashedPassword' thành '-hash_password' cho khớp Model
    const user = await User.findById(decoded.userId).select("-hash_password");

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // 4. Gán user vào req để Controller phía sau dùng
    req.user = user;

    next(); // Cho phép đi tiếp

  } catch (error) {
    console.error("Auth Middleware Error:", error);

    // Phân loại lỗi để trả về status code chuẩn
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: "Token đã hết hạn" });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }

    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};