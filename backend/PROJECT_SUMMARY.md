# BaoBao Chat App Backend - Tổng Kết Dự Án

## 📋 Tổng Quan

Dự án **BaoBao Chat App** là một ứng dụng chat real-time được xây dựng với **Node.js**, **Express**, **MongoDB**, **Socket.IO** và **TypeScript**.

**Thời gian hoàn thành:** November 2025  
**Stack:** MERN + Socket.IO + TypeScript

---

## ✅ Các Tính Năng Đã Hoàn Thành

### 1. 🔐 Authentication & Authorization

#### Endpoints (6)
- **POST** `/api/auth/register` - Đăng ký tài khoản mới
- **POST** `/api/auth/login` - Đăng nhập (JWT + Refresh Token)
- **POST** `/api/auth/logout` - Đăng xuất (xóa session)
- **POST** `/api/auth/refresh` - Làm mới access token
- **POST** `/api/auth/forgot-password` - Gửi OTP qua email
- **POST** `/api/auth/verify-otp` - Xác thực OTP
- **POST** `/api/auth/reset-password` - Đặt lại mật khẩu

#### Features
- ✅ JWT Access Token (30 phút) + Refresh Token (7 ngày)
- ✅ Refresh token được lưu trong httpOnly cookie
- ✅ Session management trong MongoDB (thay vì Redis)
- ✅ Auto cleanup expired sessions
- ✅ **OTP 6 số qua email** để reset password
- ✅ Email template HTML đẹp mắt
- ✅ Bảo mật: bcrypt hashing, token expiry

---

### 2. 👤 User Management

#### Endpoints (5)
- **GET** `/api/users/me` - Lấy thông tin user hiện tại
- **PUT** `/api/users/update` - Cập nhật profile (name, bio, phone)
- **PUT** `/api/users/change-password` - Đổi mật khẩu
- **GET** `/api/users/search?keyword=abc` - Tìm kiếm user
- **GET** `/api/users/:userId` - Lấy thông tin user theo ID

#### Features
- ✅ Profile: display_name, bio, phone, avatarURL
- ✅ Online/Offline status (online, offline, away)
- ✅ Last seen timestamp
- ✅ Search users by username or display_name
- ✅ Pagination support

---

### 3. 👥 Friend System

#### Friend Requests (6 endpoints)
- **POST** `/api/friend-requests/send` - Gửi lời mời kết bạn
- **GET** `/api/friend-requests/sent` - Danh sách lời mời đã gửi
- **GET** `/api/friend-requests/received` - Danh sách lời mời nhận được
- **POST** `/api/friend-requests/:requestId/accept` - Chấp nhận kết bạn
- **POST** `/api/friend-requests/:requestId/decline` - Từ chối kết bạn
- **DELETE** `/api/friend-requests/:requestId/cancel` - Hủy lời mời đã gửi

#### Friends (3 endpoints)
- **GET** `/api/friends` - Danh sách bạn bè
- **GET** `/api/friends/check/:userId` - Kiểm tra quan hệ bạn bè
- **DELETE** `/api/friends/:friendId` - Hủy kết bạn

#### Features
- ✅ Prevent duplicate friend requests
- ✅ Auto-create conversation khi accept friend request
- ✅ Pagination cho danh sách bạn bè
- ✅ Status tracking: pending, accepted, declined

---

### 4. 💬 Conversations

#### Endpoints (9)
- **GET** `/api/conversations` - Danh sách conversations
- **GET** `/api/conversations/:conversationId` - Chi tiết conversation
- **POST** `/api/conversations/direct/:friendId` - Tạo/lấy conversation 1-1
- **POST** `/api/conversations/group` - Tạo group chat
- **PUT** `/api/conversations/:conversationId/group-name` - Đổi tên nhóm
- **PUT** `/api/conversations/:conversationId/members` - Thêm/xóa thành viên
- **POST** `/api/conversations/:conversationId/mark-read` - Đánh dấu đã đọc
- **DELETE** `/api/conversations/:conversationId` - Xóa conversation (soft delete)

#### Features
- ✅ **Direct Chat** (1-1): Tự động tạo khi kết bạn
- ✅ **Group Chat**: Tên nhóm, avatar, danh sách thành viên
- ✅ Last message preview
- ✅ Unread count per user
- ✅ Seen by tracking
- ✅ Soft delete (isDeleted flag)
- ✅ Pagination với last message time

---

### 5. 📩 Messages

#### Endpoints (5)
- **GET** `/api/messages/:conversationId` - Lấy tin nhắn (pagination)
- **POST** `/api/messages/send` - Gửi tin nhắn
- **PUT** `/api/messages/:messageId/edit` - Chỉnh sửa tin nhắn (15 phút)
- **DELETE** `/api/messages/:messageId/recall` - Thu hồi tin nhắn
- **POST** `/api/messages/:messageId/react` - Thêm/xóa reaction (emoji)

#### Features
- ✅ Text messages + Image messages
- ✅ Edit messages (trong 15 phút)
- ✅ Recall messages (soft delete)
- ✅ **Emoji reactions** (toggle add/remove)
- ✅ **Reply to message** (replyTo field)
- ✅ Real-time delivery via Socket.IO
- ✅ Auto-update conversation's lastMessage
- ✅ Unread count tracking

---

### 6. 📤 Upload System

#### Endpoints (3)
- **POST** `/api/upload/avatar` - Upload avatar (user)
- **POST** `/api/upload/message-image` - Upload ảnh trong tin nhắn
- **POST** `/api/upload/group-avatar` - Upload avatar nhóm

#### Features
- ✅ **Cloudinary** cloud storage
- ✅ Auto resize & crop:
  - Avatar: 400x400px (max 5MB)
  - Message image: 1200x1200px (max 10MB)
- ✅ Auto delete old image khi upload mới
- ✅ File type validation (jpg, png, gif)
- ✅ Multer middleware (memory storage)
- ✅ Organize in folders: avatars/, messages/, groups/

---

### 7. 🔔 Notification System

#### Endpoints (4)
- **GET** `/api/notifications` - Danh sách thông báo
- **PUT** `/api/notifications/:notificationId/read` - Đánh dấu đã đọc
- **PUT** `/api/notifications/read-all` - Đánh dấu tất cả đã đọc
- **DELETE** `/api/notifications/:notificationId` - Xóa thông báo

#### Notification Types
- `friend_request` - Lời mời kết bạn
- `friend_accept` - Chấp nhận kết bạn
- `message` - Tin nhắn mới
- `group_invite` - Mời vào nhóm
- `group_message` - Tin nhắn nhóm

#### Features
- ✅ Real-time notification qua Socket.IO
- ✅ Filter by unread
- ✅ Unread count
- ✅ Pagination
- ✅ Auto populate relatedUser info

---

### 8. 🌐 Real-time Features (Socket.IO)

#### Events Implemented

**Connection:**
- `connection` - User connect → Set online status
- `disconnect` - User disconnect → Set offline status + lastSeen

**Conversation:**
- `join-conversation` - Join room để nhận tin nhắn
- `leave-conversation` - Leave room

**Messages:**
- `new-message` - Broadcast tin nhắn mới
- `message-updated` - Tin nhắn được edit hoặc react
- `message-recalled` - Tin nhắn bị thu hồi

**Typing:**
- `typing` - User bắt đầu gõ
- `user-typing` - Broadcast typing status
- `stop-typing` - User dừng gõ
- `user-stop-typing` - Broadcast stop typing

**Status:**
- `user-online` - Broadcast user online
- `user-offline` - Broadcast user offline

**Other:**
- `message-seen` - Đánh dấu đã xem
- `conversation-updated` - Cập nhật conversation info
- `notification` - Thông báo real-time

#### Features
- ✅ JWT authentication cho Socket.IO
- ✅ Room-based messaging (conversationId as room)
- ✅ Online users tracking
- ✅ Auto update user status in DB
- ✅ Personal room per user (for notifications)

---

## 🗄️ Database Schema

### Collections

#### 1. Users
```typescript
{
  user_name: string (unique, indexed)
  email: string (unique, indexed)
  hash_password: string
  display_name: string
  avatarURL?: string
  avatarID?: string
  bio?: string
  phone?: string
  status: "online" | "offline" | "away"
  lastSeen: Date
  sessions: [{ refreshToken, userAgent, ip, createdAt, expiresAt }]
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  resetPasswordOTP?: string
  resetPasswordOTPExpires?: Date
}
```

#### 2. Friends
```typescript
{
  userId: ObjectId (indexed)
  friendId: ObjectId (indexed)
  conversationId: ObjectId
  createdAt: Date
}
// Composite unique index: [userId, friendId]
```

#### 3. FriendRequests
```typescript
{
  senderId: ObjectId (indexed)
  receiverId: ObjectId (indexed)
  status: "pending" | "accepted" | "declined"
  createdAt: Date
}
```

#### 4. Conversations
```typescript
{
  type: "direct" | "group"
  participants: [{ userId, joinedAt }]
  group?: {
    groupName: string
    groupAvatarUrl?: string
    groupAvatarId?: string
    createdBy: ObjectId
  }
  lastMessage?: {
    _id: string
    content: string
    senderId: ObjectId
    createdAt: Date
  }
  lastMessageAt: Date (indexed)
  seenBy: ObjectId[]
  unreadCounts: Map<userId, count>
  isDeleted: boolean
}
```

#### 5. Messages
```typescript
{
  conversationId: ObjectId (indexed)
  senderId: ObjectId (indexed)
  content?: string
  imgUrl?: string
  replyTo?: ObjectId (ref Message)
  reactions: [{
    userId: ObjectId
    emoji: string
    createdAt: Date
  }]
  isRecall: boolean
  createdAt: Date (indexed)
}
// Composite index: [conversationId, createdAt]
```

#### 6. Notifications
```typescript
{
  userId: ObjectId (indexed)
  type: "friend_request" | "friend_accept" | "message" | "group_invite" | "group_message"
  title: string
  content: string
  relatedId?: ObjectId
  relatedUser?: ObjectId
  isRead: boolean (indexed)
  createdAt: Date (indexed)
}
// Composite index: [userId, isRead, createdAt]
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express v5.1.0
- **Language:** TypeScript v5.9.3
- **Database:** MongoDB v9.0.0 (Mongoose ODM)
- **Authentication:** JWT (jsonwebtoken)
- **Password:** bcrypt
- **WebSocket:** Socket.IO v4.8.1
- **File Upload:** Multer v2.0.2
- **Cloud Storage:** Cloudinary v2.8.0
- **Email:** Nodemailer v6.9.x

### Tools & Middleware
- **CORS:** cors package
- **Cookies:** cookie-parser
- **Environment:** dotenv
- **HTTP Server:** Node.js http module

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts                    # Entry point + Socket.IO setup
│   ├── controllers/
│   │   ├── authController.ts        # Auth + OTP logic
│   │   ├── userController.ts        # User management
│   │   ├── friendController.ts      # Friends CRUD
│   │   ├── friendRequestController.ts
│   │   ├── conversationController.ts
│   │   ├── messageController.ts     # Messages + Reactions
│   │   ├── notificationController.ts
│   │   └── uploadController.ts      # Cloudinary uploads
│   ├── models/
│   │   ├── User.ts
│   │   ├── Friend.ts
│   │   ├── FriendRequest.ts
│   │   ├── Conversation.ts
│   │   ├── Message.ts
│   │   └── Notification.ts
│   ├── routes/
│   │   ├── auth/
│   │   │   └── authRoute.ts
│   │   └── home/
│   │       └── index.ts             # Protected routes aggregator
│   ├── middlewares/
│   │   └── authMiddleware.ts        # JWT verification
│   ├── libs/
│   │   ├── db.ts                    # MongoDB connection
│   │   └── socket.ts                # Socket.IO handlers
│   ├── utils/
│   │   └── emailService.ts          # Nodemailer + templates
│   └── types/
│       ├── express.d.ts             # Custom Express types
│       ├── environment.d.ts         # Env variables types
│       └── modelsType/              # TypeScript interfaces
│           ├── user.ts
│           ├── friend.ts
│           ├── conversation.ts
│           ├── message.ts
│           └── notification.ts
├── .env                              # Environment variables
├── package.json
├── tsconfig.json
└── Documentation/
    ├── CHAT_APP_ROUTES.md           # API routes reference
    ├── SOCKET_EVENTS_DOCUMENTATION.md
    ├── CLOUDINARY_SETUP.md          # Upload setup guide
    ├── EMAIL_SETUP.md               # Gmail OTP setup
    └── CONVERSATIONS_MESSAGES_IMPLEMENTATION.md
```

---

## 🔧 Environment Variables

```env
# Server
PORT=8282
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://...
DB_NAME=baobao

# JWT
ACCESS_TOKEN_SECRET=your_secret_key_here

# Frontend
CLIENT_URL=http://localhost:5173

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

---

## 🚀 Cách Chạy Dự Án

### 1. Cài đặt dependencies
```bash
cd backend
npm install
# hoặc
yarn install
```

### 2. Cấu hình .env
- Tạo file `.env` từ template
- Điền các thông tin: MongoDB URI, Cloudinary, Email

### 3. Chạy development server
```bash
npm run dev
# hoặc
yarn dev
```

Server sẽ chạy tại: `http://localhost:8282`

### 4. Test API
- Import Postman collection từ `docs/`
- Hoặc dùng file `CHAT_APP_ROUTES.md` làm reference

---

## 📊 API Statistics

| Module | Endpoints | Features |
|--------|-----------|----------|
| Authentication | 7 | Register, Login, JWT Refresh, OTP Reset |
| User Management | 5 | Profile, Search, Update |
| Friend System | 9 | Requests, Friends, Accept/Decline |
| Conversations | 9 | Direct, Group, Members, Mark Read |
| Messages | 5 | Send, Edit, Recall, React, Reply |
| Upload | 3 | Avatar, Message Image, Group Avatar |
| Notifications | 4 | List, Read, Read All, Delete |
| **TOTAL** | **42** | **Full-featured Chat App** |

---

## 🌟 Highlights & Best Practices

### Security
- ✅ JWT với short-lived access token (30 min)
- ✅ Refresh token trong httpOnly cookie
- ✅ bcrypt password hashing (10 rounds)
- ✅ OTP expiry (10 phút)
- ✅ Token expiry tracking
- ✅ CORS configuration
- ✅ Input validation

### Performance
- ✅ MongoDB indexing (user_name, email, conversationId, createdAt)
- ✅ Composite indexes cho queries phức tạp
- ✅ Pagination cho tất cả list endpoints
- ✅ Populate only needed fields
- ✅ Efficient queries (no N+1 problem)

### Scalability
- ✅ Room-based Socket.IO (không broadcast toàn bộ)
- ✅ Session cleanup tự động
- ✅ Soft delete thay vì hard delete
- ✅ Cloudinary CDN cho images
- ✅ Stateless JWT authentication

### Code Quality
- ✅ TypeScript full coverage
- ✅ Interface cho tất cả models
- ✅ Error handling consistent
- ✅ Async/await pattern
- ✅ Modular architecture
- ✅ Reusable helper functions

### User Experience
- ✅ Real-time everything (messages, typing, online status)
- ✅ Email templates đẹp mắt
- ✅ Unread count tracking
- ✅ Seen by functionality
- ✅ Message reactions
- ✅ Reply to message
- ✅ Edit & recall messages

---

## 📝 Documentation Files

1. **CHAT_APP_ROUTES.md** - API endpoints reference đầy đủ
2. **SOCKET_EVENTS_DOCUMENTATION.md** - Socket.IO events, flows, examples
3. **CLOUDINARY_SETUP.md** - Hướng dẫn setup Cloudinary upload
4. **EMAIL_SETUP.md** - Hướng dẫn setup Gmail OTP
5. **CONVERSATIONS_MESSAGES_IMPLEMENTATION.md** - Chi tiết conversation logic

---

## 🎯 Features Checklist

### Core Features
- [x] User Registration & Login
- [x] JWT Authentication + Refresh Token
- [x] Forgot Password with OTP Email
- [x] User Profile Management
- [x] Friend Request System
- [x] Direct Chat (1-1)
- [x] Group Chat
- [x] Send Text Messages
- [x] Send Image Messages
- [x] Edit Messages (15 min window)
- [x] Recall Messages
- [x] Message Reactions
- [x] Reply to Messages
- [x] Real-time Message Delivery
- [x] Typing Indicators
- [x] Online/Offline Status
- [x] Seen/Unread Tracking
- [x] Push Notifications
- [x] Image Upload (Avatar, Messages, Groups)

### Advanced Features
- [x] Session Management (Multiple devices)
- [x] Auto Cleanup Expired Sessions
- [x] Conversation Soft Delete
- [x] Group Management (Add/Remove members)
- [x] Search Users
- [x] Pagination for all lists
- [x] Email Notifications (OTP, Password Reset Success)
- [x] Cloudinary Integration
- [x] Socket.IO Authentication
- [x] Room-based Real-time Communication

---

## 🔮 Future Enhancements (Optional)

### Potential Features
- [ ] Voice Messages
- [ ] Video Calls
- [ ] File Sharing (PDF, DOCX, etc.)
- [ ] Message Search
- [ ] Pin Messages
- [ ] Archive Conversations
- [ ] Block Users
- [ ] Report Users
- [ ] Admin Dashboard
- [ ] Analytics & Metrics
- [ ] Rate Limiting (Express Rate Limit)
- [ ] Redis Caching
- [ ] Message Encryption (E2E)
- [ ] Two-Factor Authentication (2FA)
- [ ] Social Login (Google, Facebook)

### Infrastructure
- [ ] Docker containerization
- [ ] CI/CD Pipeline
- [ ] Unit Tests (Jest)
- [ ] Integration Tests
- [ ] Load Balancing
- [ ] Horizontal Scaling
- [ ] Monitoring (Prometheus, Grafana)
- [ ] Logging (Winston, Morgan)

---

## 🐛 Known Issues & Limitations

1. **Session Cleanup:** Manual cleanup via method, not automatic TTL (MongoDB limitation với nested arrays)
2. **Gmail Limits:** 500 emails/day (đủ cho dev, cần service khác cho production)
3. **Socket.IO Scale:** Cần Redis adapter nếu scale nhiều server instances
4. **File Size:** Upload limit 10MB (có thể tăng nếu cần)

---

## 📞 API Endpoints Summary

### Public Endpoints (No Auth)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/verify-otp
POST   /api/auth/reset-password
```

### Protected Endpoints (Require JWT)
```
# Auth
POST   /api/auth/logout
POST   /api/auth/refresh

# Users
GET    /api/users/me
PUT    /api/users/update
PUT    /api/users/change-password
GET    /api/users/search
GET    /api/users/:userId

# Friend Requests
POST   /api/friend-requests/send
GET    /api/friend-requests/sent
GET    /api/friend-requests/received
POST   /api/friend-requests/:requestId/accept
POST   /api/friend-requests/:requestId/decline
DELETE /api/friend-requests/:requestId/cancel

# Friends
GET    /api/friends
GET    /api/friends/check/:userId
DELETE /api/friends/:friendId

# Conversations
GET    /api/conversations
GET    /api/conversations/:conversationId
POST   /api/conversations/direct/:friendId
POST   /api/conversations/group
PUT    /api/conversations/:conversationId/group-name
PUT    /api/conversations/:conversationId/members
POST   /api/conversations/:conversationId/mark-read
DELETE /api/conversations/:conversationId

# Messages
GET    /api/messages/:conversationId
POST   /api/messages/send
PUT    /api/messages/:messageId/edit
DELETE /api/messages/:messageId/recall
POST   /api/messages/:messageId/react

# Upload
POST   /api/upload/avatar
POST   /api/upload/message-image
POST   /api/upload/group-avatar

# Notifications
GET    /api/notifications
PUT    /api/notifications/:notificationId/read
PUT    /api/notifications/read-all
DELETE /api/notifications/:notificationId
```

---

## 🎓 What I Learned

### Technical Skills
- ✅ WebSocket real-time communication với Socket.IO
- ✅ JWT authentication best practices
- ✅ MongoDB schema design cho chat app
- ✅ TypeScript advanced types & interfaces
- ✅ Cloudinary cloud storage integration
- ✅ Nodemailer email service
- ✅ Session management trong MongoDB
- ✅ Complex queries với Mongoose
- ✅ File upload với Multer

### Architecture Patterns
- ✅ MVC pattern (Model-View-Controller)
- ✅ Repository pattern (tách logic DB)
- ✅ Middleware chain
- ✅ Helper functions & utils
- ✅ Modular route organization
- ✅ TypeScript interfaces cho type safety

### Best Practices
- ✅ Environment variables cho config
- ✅ Error handling consistent
- ✅ Input validation
- ✅ Security headers & CORS
- ✅ Code organization & structure
- ✅ Documentation (README, API docs)

---

## 💡 Conclusion

Đây là một **full-featured chat application backend** với:
- **42 API endpoints**
- **Real-time communication** (Socket.IO)
- **Secure authentication** (JWT + OTP)
- **Cloud storage** (Cloudinary)
- **Email service** (Nodemailer)
- **TypeScript** full coverage
- **Production-ready** architecture

Project hoàn toàn có thể deploy lên production với minor adjustments (rate limiting, logging, monitoring).

---

**Developed with ❤️ using Node.js, Express, MongoDB, Socket.IO & TypeScript**

**Date:** November 2025  
**Version:** 1.0.0
