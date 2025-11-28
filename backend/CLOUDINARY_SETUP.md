# Hướng dẫn cấu hình Cloudinary cho Upload Avatar

## Cloudinary là gì?
Cloudinary là dịch vụ cloud storage chuyên cho hình ảnh và video, cung cấp:
- Lưu trữ ảnh không giới hạn (free tier: 25GB)
- Tự động resize, crop, optimize ảnh
- CDN toàn cầu (load ảnh nhanh)
- Free tier: 25 credits/tháng

## Các bước setup

### 1. Đăng ký tài khoản Cloudinary (FREE)

1. Truy cập: https://cloudinary.com/users/register/free
2. Đăng ký bằng email hoặc Google
3. Verify email

### 2. Lấy thông tin API Keys

Sau khi đăng nhập, vào **Dashboard**:

```
Dashboard URL: https://console.cloudinary.com/console
```

Bạn sẽ thấy:
```
Account Details
├── Cloud name: your_cloud_name
├── API Key: 123456789012345
└── API Secret: abcdefghijklmnopqrstuvwxyz (Click "Show" để xem)
```

### 3. Cấu hình .env file

Mở file `.env` trong backend và thêm:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Ví dụ thực tế:**
```env
CLOUDINARY_CLOUD_NAME=dxyz1234abc
CLOUDINARY_API_KEY=987654321098765
CLOUDINARY_API_SECRET=Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9
```

### 4. Kiểm tra cấu hình

Code đã sẵn sàng trong `uploadController.ts`:

```typescript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

### 5. Test upload

Sau khi cấu hình xong, test bằng Postman:

**Endpoint:** `POST http://localhost:8282/api/upload/avatar`

**Headers:**
```
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
Key: avatar
Value: [Choose File] → Chọn file ảnh (jpg, png, gif)
```

**Response thành công:**
```json
{
  "message": "Upload avatar thành công",
  "avatarURL": "https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/avatars/user_123abc.jpg"
}
```

## Các tính năng Upload đã implement

### 1. Upload Avatar (User)
- **Endpoint:** `POST /api/upload/avatar`
- **Max size:** 5MB
- **Formats:** jpg, jpeg, png, gif
- **Auto resize:** 400x400px
- **Auto delete:** Xóa avatar cũ khi upload mới

### 2. Upload Message Image
- **Endpoint:** `POST /api/upload/message-image`
- **Max size:** 10MB
- **Formats:** jpg, jpeg, png, gif
- **Auto resize:** 1200x1200px (giữ nguyên aspect ratio)

### 3. Upload Group Avatar
- **Endpoint:** `POST /api/upload/group-avatar`
- **Body:** `groupId` + `avatar` file
- **Max size:** 5MB
- **Auto resize:** 400x400px
- **Validation:** Chỉ group owner mới upload được

## Cloudinary Free Tier Limits

✅ **Storage:** 25GB
✅ **Bandwidth:** 25GB/tháng
✅ **Transformations:** 25,000 credits/tháng
✅ **Max file size:** 10MB (có thể tăng lên 100MB)

**Đủ dùng cho:**
- Hàng nghìn user
- Hàng chục nghìn ảnh
- App chat cá nhân/nhóm nhỏ

## Troubleshooting

### Lỗi: "Must supply api_key"
❌ **Nguyên nhân:** Chưa cấu hình `.env` hoặc thiếu biến môi trường

✅ **Giải pháp:** 
1. Kiểm tra file `.env` có đầy đủ 3 biến CLOUDINARY_*
2. Restart server sau khi sửa `.env`
3. Kiểm tra không có space thừa trong `.env`

### Lỗi: "Invalid API Key"
❌ **Nguyên nhân:** API Key sai hoặc đã bị revoke

✅ **Giải pháp:**
1. Vào Cloudinary Dashboard
2. Copy lại API Key và API Secret
3. Paste vào `.env` (không có dấu ngoặc kép)

### Lỗi: "Insufficient storage"
❌ **Nguyên nhân:** Đã dùng hết 25GB free tier

✅ **Giải pháp:**
1. Xóa ảnh cũ không dùng trong Cloudinary Dashboard
2. Hoặc upgrade plan (từ $0.04/GB)

## Bảo mật

⚠️ **QUAN TRỌNG:**

1. **KHÔNG commit file `.env` lên Git**
   ```bash
   # Thêm vào .gitignore
   .env
   .env.local
   ```

2. **KHÔNG share API Secret** với ai
   - API Secret giống như password
   - Nếu bị lộ, vào Dashboard → Reset API Secret

3. **Sử dụng Environment Variables**
   - Production: Dùng Railway/Vercel/Heroku env vars
   - Development: Dùng `.env` file

## Nâng cao: Media Library

Cloudinary Dashboard cung cấp:
- **Media Library:** Quản lý tất cả ảnh đã upload
- **Transformations:** Xem lịch sử resize/crop
- **Analytics:** Theo dõi storage & bandwidth usage
- **Folders:** Tổ chức ảnh theo thư mục (avatars/, messages/, groups/)

Code đã tự động tổ chức:
```typescript
folder: "avatars"  // Tất cả avatar trong folder "avatars/"
folder: "messages" // Tất cả message image trong "messages/"
folder: "groups"   // Tất cả group avatar trong "groups/"
```

## Support

- **Docs:** https://cloudinary.com/documentation
- **API Reference:** https://cloudinary.com/documentation/image_upload_api_reference
- **Support:** https://support.cloudinary.com
