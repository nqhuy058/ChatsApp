import nodemailer from "nodemailer";
import dotenv from 'dotenv';

// 1. Thêm dòng này để file tự đọc .env
dotenv.config();

/**
 * Cấu hình transporter cho nodemailer
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    // 2. Sửa lại tên biến cho khớp với file .env
    pass: process.env.EMAIL_PASS,
  },
});


/**
 * Gửi OTP qua email
 */
export const sendOTPEmail = async (
  to: string,
  otp: string,
  userName: string
): Promise<void> => {
  const mailOptions = {
    from: `"BaoBao Chat App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Mã OTP đặt lại mật khẩu - BaoBao",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
          }
          h1 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 24px;
          }
          .otp-box {
            background: #f7fafc;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: white;
            margin-top: 20px;
            font-size: 14px;
          }
          .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>🔐 Đặt lại mật khẩu</h1>
            
            <p>Xin chào <strong>${userName}</strong>,</p>
            
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản BaoBao của mình. Đây là mã OTP của bạn:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666;">Mã OTP có hiệu lực trong <strong>10 phút</strong></p>
            </div>
            
            <p>Nhập mã này vào form đặt lại mật khẩu để tiếp tục.</p>
            
            <div class="warning">
              <strong>⚠️ Lưu ý bảo mật:</strong><br>
              • Không chia sẻ mã OTP này với bất kỳ ai<br>
              • BaoBao sẽ không bao giờ yêu cầu mã OTP qua điện thoại hoặc email khác<br>
              • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này
            </div>
            
            <p style="margin-top: 30px;">Trân trọng,<br><strong>BaoBao Team</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2025 BaoBao Chat App. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Gửi email xác nhận đặt lại mật khẩu thành công
 */
export const sendPasswordResetSuccessEmail = async (
  to: string,
  userName: string
): Promise<void> => {
  const mailOptions = {
    from: `"BaoBao Chat App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Mật khẩu đã được đặt lại thành công - BaoBao",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
          }
          .success-icon {
            text-align: center;
            font-size: 64px;
            margin: 20px 0;
          }
          h1 {
            color: #11998e;
            text-align: center;
            margin-bottom: 20px;
          }
          .info-box {
            background: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            color: white;
            margin-top: 20px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="success-icon">✅</div>
            <h1>Mật khẩu đã được đặt lại thành công!</h1>
            
            <p>Xin chào <strong>${userName}</strong>,</p>
            
            <p>Mật khẩu cho tài khoản BaoBao của bạn đã được đặt lại thành công.</p>
            
            <div class="info-box">
              <strong>✓ Thời gian:</strong> ${new Date().toLocaleString("vi-VN")}<br>
              <strong>✓ Tài khoản:</strong> ${to}
            </div>
            
            <p>Bạn có thể đăng nhập ngay bây giờ với mật khẩu mới của mình.</p>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
              <strong>Lưu ý:</strong> Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức để bảo vệ tài khoản của bạn.
            </p>
            
            <p style="margin-top: 30px;">Trân trọng,<br><strong>BaoBao Team</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2025 BaoBao Chat App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
