# Hướng dẫn cấu hình Email (Gmail) để gửi OTP

## Tại sao cần Email Service?

Để gửi mã OTP (One-Time Password) đặt lại mật khẩu qua email cho users.

## Các bước setup Gmail

### 1. Sử dụng Gmail làm Email gửi

Bạn có thể dùng Gmail cá nhân hoặc tạo Gmail riêng cho app.

**Ví dụ:** `baobao.chatapp@gmail.com`

---

### 2. Bật 2-Step Verification (Bắt buộc)

1. Vào: https://myaccount.google.com/security
2. Tìm mục **"2-Step Verification"**
3. Click **"Get Started"** và làm theo hướng dẫn
4. Verify bằng số điện thoại

---

### 3. Tạo App Password (QUAN TRỌNG)

⚠️ **App Password** khác với mật khẩu Gmail thông thường!

**Các bước:**

1. Vào: https://myaccount.google.com/apppasswords
   
   Hoặc:
   - Google Account → Security → 2-Step Verification
   - Kéo xuống dưới cùng → **"App passwords"**

2. Click **"Select app"** → Chọn **"Other (Custom name)"**

3. Đặt tên: `BaoBao Backend` hoặc `Nodemailer`

4. Click **"Generate"**

5. Google sẽ hiển thị mật khẩu 16 ký tự:
   ```
   abcd efgh ijkl mnop
   ```

6. **COPY MẬT KHẨU NÀY** (chỉ hiện 1 lần duy nhất)

---

### 4. Cấu hình .env file

Mở file `.env` và thêm:

```env
# Email Configuration
EMAIL_USER=baobao.chatapp@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Lưu ý:**
- `EMAIL_USER`: Email Gmail của bạn
- `EMAIL_PASSWORD`: App Password 16 ký tự (KHÔNG có khoảng trắng)

**Ví dụ thực tế:**
```env
EMAIL_USER=myemail@gmail.com
EMAIL_PASSWORD=xyzw1234abcd5678
```

---

## Test gửi OTP

### Endpoint: Forgot Password

**POST** `http://localhost:8282/api/auth/forgot-password`

**Body (JSON):**
```json
{
  "email": "user@example.com"
}
```

**Response thành công:**
```json
{
  "message": "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư",
  "otp": "123456" // Chỉ trong dev, production sẽ không trả về
}
```

**Email nhận được:**
```
Tiêu đề: Mã OTP đặt lại mật khẩu - BaoBao
Nội dung: HTML template với mã OTP 6 số
```

---

### Endpoint: Verify OTP

**POST** `http://localhost:8282/api/auth/verify-otp`

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response thành công:**
```json
{
  "message": "Xác thực OTP thành công",
  "resetToken": "a1b2c3d4e5f6..." // Token để đổi mật khẩu
}
```

---

### Endpoint: Reset Password

**POST** `http://localhost:8282/api/auth/reset-password`

**Body (JSON):**
```json
{
  "token": "a1b2c3d4e5f6...",
  "new_password": "NewPassword123"
}
```

**Response thành công:**
```json
{
  "message": "Đặt lại mật khẩu thành công"
}
```

**Email xác nhận tự động được gửi:**
```
Tiêu đề: Mật khẩu đã được đặt lại thành công - BaoBao
Nội dung: Thông báo đổi mật khẩu thành công
```

---

## Flow hoàn chỉnh

```
1. User nhập email → POST /forgot-password
   ↓
2. Backend tạo OTP 6 số → Lưu vào DB → Gửi email
   ↓
3. User nhận email → Nhập OTP → POST /verify-otp
   ↓
4. Backend verify OTP → Trả về resetToken
   ↓
5. User nhập mật khẩu mới → POST /reset-password
   ↓
6. Backend đổi mật khẩu → Gửi email xác nhận
```

---

## Troubleshooting

### Lỗi: "Invalid login: 535-5.7.8 Username and Password not accepted"

❌ **Nguyên nhân:**
- Chưa bật 2-Step Verification
- Dùng mật khẩu Gmail thông thường thay vì App Password
- App Password sai hoặc có khoảng trắng

✅ **Giải pháp:**
1. Bật 2-Step Verification
2. Tạo App Password mới
3. Copy App Password (KHÔNG có khoảng trắng)
4. Paste vào `.env` file

---

### Lỗi: "Missing credentials for 'PLAIN'"

❌ **Nguyên nhân:** Thiếu `EMAIL_USER` hoặc `EMAIL_PASSWORD` trong `.env`

✅ **Giải pháp:**
1. Kiểm tra file `.env` có đầy đủ 2 biến
2. Restart server sau khi sửa `.env`

---

### Lỗi: "Connection timeout"

❌ **Nguyên nhân:**
- Firewall chặn port 587/465
- Mạng công ty/trường học chặn SMTP

✅ **Giải pháp:**
1. Thử đổi port trong `emailService.ts`:
   ```typescript
   port: 465,
   secure: true,
   ```
2. Dùng mạng khác (mobile hotspot)
3. Hoặc dùng service khác (SendGrid, Mailgun)

---

### Email vào Spam

❌ **Nguyên nhân:** Gmail cá nhân gửi email bị đánh dấu spam

✅ **Giải pháp:**
1. Kiểm tra Spam folder của người nhận
2. Mark email là "Not Spam"
3. Nâng cao: Dùng service chuyên nghiệp (SendGrid, AWS SES)

---

## Giới hạn Gmail

📊 **Gmail Free Tier:**
- **500 emails/ngày** (đủ cho app nhỏ)
- **100 recipients/email**
- Rate limit: Không quá nhanh (có delay giữa các email)

**Khi nào cần nâng cấp:**
- App có hàng nghìn users
- Cần gửi > 500 OTP/ngày
- Cần deliverability cao hơn

**Lựa chọn thay thế:**
- **SendGrid** (100 emails/ngày miễn phí)
- **Mailgun** (5000 emails/tháng miễn phí 3 tháng đầu)
- **AWS SES** (62,000 emails/tháng miễn phí nếu gửi từ EC2)

---

## Bảo mật

⚠️ **QUAN TRỌNG:**

1. **KHÔNG commit `.env` lên Git**
   ```bash
   # .gitignore
   .env
   .env.local
   ```

2. **KHÔNG share App Password**
   - Nếu bị lộ, revoke ngay tại: https://myaccount.google.com/apppasswords
   - Tạo App Password mới

3. **Rate Limiting**
   - Giới hạn số lần yêu cầu OTP (5 lần/giờ/email)
   - Prevent spam/abuse

4. **OTP Expiry**
   - Code đã set: **10 phút**
   - Không nên quá dài (bảo mật)
   - Không nên quá ngắn (UX)

---

## Code Structure

**File đã tạo:**

1. `src/utils/emailService.ts`
   - `sendOTPEmail()` - Gửi OTP 6 số
   - `sendPasswordResetSuccessEmail()` - Xác nhận đổi mật khẩu

2. `src/controllers/authController.ts`
   - `requestPasswordReset()` - Tạo OTP và gửi email
   - `verifyOTP()` - Verify OTP và trả resetToken
   - `resetPassword()` - Đổi mật khẩu với resetToken

3. `src/models/User.ts`
   - Thêm fields: `resetPasswordOTP`, `resetPasswordOTPExpires`

4. `src/routes/auth/authRoute.ts`
   - `POST /forgot-password`
   - `POST /verify-otp`
   - `POST /reset-password`

---

## Email Template Preview

### OTP Email

```
┌─────────────────────────────────────┐
│  🔐 Đặt lại mật khẩu               │
│                                     │
│  Xin chào [Tên User],              │
│                                     │
│  Đây là mã OTP của bạn:            │
│                                     │
│  ┌─────────────────┐               │
│  │   1 2 3 4 5 6   │               │
│  └─────────────────┘               │
│  Hiệu lực: 10 phút                 │
│                                     │
│  ⚠️ Lưu ý bảo mật:                 │
│  • Không chia sẻ mã OTP            │
│  • BaoBao không bao giờ hỏi OTP   │
│                                     │
│  © 2025 BaoBao Chat App            │
└─────────────────────────────────────┘
```

### Success Email

```
┌─────────────────────────────────────┐
│          ✅                         │
│  Mật khẩu đã được đặt lại          │
│  thành công!                        │
│                                     │
│  ✓ Thời gian: [timestamp]          │
│  ✓ Tài khoản: [email]              │
│                                     │
│  Bạn có thể đăng nhập ngay         │
│  với mật khẩu mới.                 │
│                                     │
│  © 2025 BaoBao Chat App            │
└─────────────────────────────────────┘
```

---

## Support

- **Nodemailer Docs:** https://nodemailer.com/about/
- **Gmail SMTP:** https://support.google.com/mail/answer/7126229
- **App Passwords:** https://support.google.com/accounts/answer/185833
