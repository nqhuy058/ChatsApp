import bcrypt from "bcrypt";
import User from "../models/User";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOTPEmail, sendPasswordResetSuccessEmail } from "../utils/emailService.js";
// Cấu hình thời gian
const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 ngày
// --- CẤU HÌNH COOKIE CHUẨN ---
// Tự động nhận diện môi trường để set Secure
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Localhost (false) chạy ngon, Deploy (true) bảo mật
    sameSite: (isProduction ? 'none' : 'strict'), // 'strict' tốt cho localhost, 'none' tốt cho cross-domain
    maxAge: REFRESH_TOKEN_TTL
};
/**
 * Đăng ký user mới
 */
const register = async (req, res) => {
    try {
        const { user_name, password, email, first_name, last_name } = req.body;
        if (!user_name || !password || !email || !first_name || !last_name) {
            res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
            return;
        }
        const duplicate = await User.findOne({ $or: [{ user_name }, { email }] });
        if (duplicate) {
            res.status(409).json({ message: "Username hoặc email đã tồn tại" });
            return;
        }
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
        const hash_password = await bcrypt.hash(password, saltRounds);
        // 1. Lưu lại kết quả của User.create
        const newUser = await User.create({
            user_name,
            hash_password,
            email,
            display_name: `${first_name} ${last_name}`,
            sessions: []
        });
        // 2. Trả về đối tượng user mới trong response
        res.status(201).json({ message: "Đăng ký thành công", user: newUser });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi server khi đăng ký" });
    }
};
/**
 * Đăng nhập
 */
const login = async (req, res) => {
    try {
        const { user_name: email_or_username, password } = req.body;
        if (!email_or_username || !password) {
            res.status(400).json({ message: "Thiếu user_name hoặc password" });
            return;
        }
        const user = await User.findOne({
            $or: [{ email: email_or_username }, { user_name: email_or_username }],
        });
        if (!user) {
            res.status(401).json({ message: "Sai username hoặc password" });
            return;
        }
        const isValidPassword = await bcrypt.compare(password, user.hash_password);
        if (!isValidPassword) {
            res.status(401).json({ message: "Sai username hoặc password" });
            return;
        }
        // 1. Tạo Access Token
        const accessToken = jwt.sign({ userId: user._id }, 
        // SỬA Ở ĐÂY: Dùng đúng tên biến ACCESS_TOKEN_SECRET
        process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
        // 2. Tạo Refresh Token
        const refreshToken = crypto.randomBytes(64).toString("hex");
        // 3. Lưu Session
        const sessionExpiry = new Date();
        sessionExpiry.setDate(sessionExpiry.getDate() + 7);
        if (user.removeExpiredSessions) {
            await user.removeExpiredSessions();
        }
        user.sessions.push({
            refreshToken,
            userAgent: req.headers["user-agent"] || "Unknown",
            ip: req.ip || "Unknown",
            createdAt: new Date(),
            expiresAt: sessionExpiry,
        });
        await user.save();
        // 4. Trả về Cookie (Dùng options đã cấu hình ở trên)
        res.cookie('refreshToken', refreshToken, cookieOptions);
        res.status(200).json({
            message: "Đăng nhập thành công",
            accessToken,
            user
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Lỗi server khi đăng nhập",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
/**
 * Đăng xuất
 */
const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            res.status(204).send();
            return;
        }
        // Xóa trong DB
        await User.findOneAndUpdate({ "sessions.refreshToken": refreshToken }, { $pull: { sessions: { refreshToken: refreshToken } } });
        // Xóa Cookie (Quan trọng: Phải truyền options giống hệt lúc tạo mới xóa được sạch)
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'strict'
        });
        res.status(200).json({ message: "Đăng xuất thành công" });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Lỗi server khi đăng xuất" });
    }
};
/**
 * Refresh Token
 */
const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ message: "Không tìm thấy refresh token" });
            return;
        }
        const user = await User.findOne({ "sessions.refreshToken": refreshToken });
        if (!user) {
            res.status(403).json({ message: "Refresh token không hợp lệ" });
            return;
        }
        // Dọn rác session cũ
        if (user.removeExpiredSessions) {
            await user.removeExpiredSessions();
        }
        const session = user.sessions.find(s => s.refreshToken === refreshToken);
        if (!session) {
            // Xóa cookie nếu session không còn trong DB (hoặc đã hết hạn bị xóa)
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'strict'
            });
            res.status(403).json({ message: "Refresh token đã hết hạn hoặc không hợp lệ" });
            return;
        }
        const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
        // Quan trọng: Trả về cả User để Frontend cập nhật Store
        res.status(200).json({ accessToken, user });
    }
    catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Yêu cầu đặt lại mật khẩu
 */
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: "Email là bắt buộc" });
            return;
        }
        const user = await User.findOne({ email });
        // Bảo mật: Không báo lỗi nếu email không tồn tại để tránh dò user
        if (!user) {
            res.status(200).json({ message: "Nếu email tồn tại, mã OTP đã được gửi" });
            return;
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
        await user.save();
        try {
            await sendOTPEmail(email, otp, user.display_name);
        }
        catch (emailError) {
            console.error("Failed to send email:", emailError);
            res.status(500).json({ message: "Không thể gửi email. Vui lòng thử lại sau" });
            return;
        }
        res.status(200).json({
            message: "Mã OTP đã được gửi đến email của bạn.",
            // ⚠️ LƯU Ý: Khi Deploy thật nhớ xóa dòng otp này đi nhé!
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    }
    catch (error) {
        console.error("Request password reset error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Xác thực OTP
 */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ message: "Email và OTP là bắt buộc" });
            return;
        }
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: new Date() }
        });
        if (!user) {
            res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
            return;
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();
        res.status(200).json({
            message: "Xác thực OTP thành công",
            resetToken
        });
    }
    catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
/**
 * Đặt lại mật khẩu
 */
const resetPassword = async (req, res) => {
    try {
        const { token, new_password } = req.body;
        if (!token || !new_password) {
            res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
            return;
        }
        if (new_password.length < 6) {
            res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
            return;
        }
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });
        if (!user) {
            res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
            return;
        }
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
        user.hash_password = await bcrypt.hash(new_password, saltRounds);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        // Có thể xem xét xóa hết session cũ để bắt user login lại bằng mật khẩu mới
        // user.sessions = []; 
        await user.save();
        try {
            await sendPasswordResetSuccessEmail(user.email, user.display_name);
        }
        catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
        }
        res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
    }
    catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
export const authController = {
    register,
    login,
    logout,
    refreshToken,
    requestPasswordReset,
    verifyOTP,
    resetPassword
};
