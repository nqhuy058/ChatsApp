# Conversations & Messages Implementation Plan

## 📋 Tổng quan
Triển khai đầy đủ chức năng chat (conversations và messages) cho ứng dụng chat.

---

## 🎯 Phase 1: Conversations (Direct Chat)

### 1.1 Controller Methods (`conversationController.ts`)

#### `getConversations`
- **Route**: `GET /api/conversations?page=1&limit=20&type=direct|group`
- **Logic**:
  - Lấy danh sách conversations mà user là participant
  - Filter theo type nếu có
  - Sort by lastMessageAt DESC
  - Populate: participants.userId (basic info), lastMessage.senderId
  - Tính unreadCount cho từng conversation
  - Pagination
- **Return**: List conversations với unread count

#### `getConversationById`
- **Route**: `GET /api/conversations/:conversationId`
- **Logic**:
  - Lấy chi tiết một conversation
  - Validate: User phải là member
  - Populate: participants.userId (full info), group info nếu là group
- **Return**: Conversation object chi tiết

#### `getOrCreateDirectConversation`
- **Route**: `POST /api/conversations/direct`
- **Body**: `{ userId }`
- **Logic**:
  1. Validate: userId hợp lệ, không phải chính mình
  2. Check xem đã là bạn bè chưa (required)
  3. Tìm conversation direct đã tồn tại giữa 2 người
  4. Nếu có: return conversation đó
  5. Nếu chưa: tạo mới conversation type="direct"
- **Return**: Conversation object

#### `markAsRead`
- **Route**: `PATCH /api/conversations/:conversationId/mark-read`
- **Logic**:
  1. Validate: User phải là member
  2. Add currentUser vào seenBy (nếu chưa có)
  3. Reset unreadCounts[currentUserId] = 0
- **Return**: Success message

#### `deleteOrLeaveConversation`
- **Route**: `DELETE /api/conversations/:conversationId`
- **Logic**:
  - Direct: Xóa hoàn toàn conversation + messages
  - Group: Remove user khỏi participants (rời nhóm)
  - Validate: User phải là member
- **Return**: Success message

---

## 🎯 Phase 2: Conversations (Group Chat)

### 2.1 Controller Methods (tiếp `conversationController.ts`)

#### `createGroupConversation`
- **Route**: `POST /api/conversations/group`
- **Body**: `{ name, participantIds[] }`
- **Logic**:
  1. Validate:
     - name không rỗng
     - participantIds tối thiểu 2 người (+ creator = 3)
     - Tất cả participants phải là bạn bè của creator
  2. Tạo conversation type="group"
  3. Set group.name, group.createdBy = currentUser
  4. participants = [creator, ...participantIds]
- **Return**: Group conversation object

#### `updateGroupName`
- **Route**: `PATCH /api/conversations/:conversationId/group-name`
- **Body**: `{ name }`
- **Logic**:
  - Validate: Phải là group, user phải là member
  - Update group.name
- **Return**: Updated conversation

#### `addGroupMembers`
- **Route**: `POST /api/conversations/:conversationId/members`
- **Body**: `{ userIds[] }`
- **Logic**:
  1. Validate:
     - Phải là group conversation
     - User hiện tại phải là member
     - Tất cả userIds phải là bạn bè của user hiện tại
     - userIds chưa có trong group
  2. Add userIds vào participants
- **Return**: Updated conversation

#### `removeGroupMember`
- **Route**: `DELETE /api/conversations/:conversationId/members/:userId`
- **Logic**:
  - Validate: Phải là group conversation
  - Case 1: userId = currentUser → Tự rời nhóm (allowed)
  - Case 2: userId khác → Chỉ creator mới kick được
  - Remove userId khỏi participants
- **Return**: Updated conversation

---

## 🎯 Phase 3: Messages

### 3.1 Controller Methods (`messageController.ts`)

#### `getMessages`
- **Route**: `GET /api/messages/:conversationId?page=1&limit=50&before=messageId`
- **Logic**:
  1. Validate: User phải là member của conversation
  2. Query messages trong conversation
  3. Filter: isRecall = false (hoặc hiện cả recalled)
  4. Sort: createdAt DESC (tin mới nhất trước)
  5. Pagination: Nếu có `before`, lấy messages trước messageId đó
  6. Populate: senderId (display_name, avatarURL)
- **Return**: Paginated messages

#### `sendMessage`
- **Route**: `POST /api/messages`
- **Body**: `{ conversationId, content?, imgUrl? }`
- **Logic**:
  1. Validate:
     - conversationId hợp lệ
     - User phải là member của conversation
     - Ít nhất có content hoặc imgUrl
  2. Tạo Message
  3. Update Conversation:
     - lastMessage = { _id, content, senderId, createdAt }
     - lastMessageAt = now
     - Tăng unreadCounts cho các user khác (trừ sender)
     - Reset seenBy = [senderId]
  4. TODO: Trigger WebSocket event (future)
- **Return**: Message object

#### `editMessage`
- **Route**: `PATCH /api/messages/:messageId`
- **Body**: `{ content }`
- **Logic**:
  1. Validate:
     - User phải là sender của message
     - Message chưa bị recall
     - Trong vòng 15 phút (editTimeLimit)
  2. Update message.content
  3. Nếu là lastMessage: Update conversation.lastMessage.content
- **Return**: Updated message

#### `recallMessage`
- **Route**: `DELETE /api/messages/:messageId`
- **Logic**:
  1. Validate:
     - User phải là sender
     - Message chưa bị recall
  2. Set isRecall = true (soft delete)
  3. Nếu là lastMessage:
     - Tìm tin nhắn trước đó (chưa recall)
     - Update conversation.lastMessage
- **Return**: Success message

---

## 🛠️ Models Cần Bổ Sung Fields

### ❌ Conversation Model - CẦN THÊM
```typescript
groupAvatar?: string;      // URL ảnh đại diện nhóm
groupAvatarId?: string;    // ID ảnh trên cloud
```

### ✅ Message Model - ĐÃ CÓ
- `isRecall` - Đã có rồi ✅

---

## 📁 File Structure

### Controllers
```
src/controllers/
  ├── conversationController.ts  (NEW)
  └── messageController.ts       (NEW)
```

### Routes
```
src/routes/home/
  ├── conversationRoute.ts       (NEW)
  └── messageRoute.ts            (NEW)
```

### Models - Cập nhật
```
src/models/
  └── Convesation.ts            (UPDATE - thêm groupAvatar fields)
```

### Types - Cập nhật
```
src/types/modelsType/
  └── conversation.ts           (UPDATE - thêm groupAvatar vào interface)
```

---

## 🔄 Implementation Order

### Step 1: Update Models & Interfaces
- [ ] Update `IConversation` interface - thêm `groupAvatar`, `groupAvatarId`
- [ ] Update `Convesation.ts` model - thêm fields vào schema

### Step 2: Conversation Controller - Direct Chat
- [ ] Tạo `conversationController.ts`
- [ ] Implement `getConversations` (list với pagination)
- [ ] Implement `getConversationById` (chi tiết)
- [ ] Implement `getOrCreateDirectConversation` (tạo/lấy direct chat)
- [ ] Implement `markAsRead` (đánh dấu đã đọc)
- [ ] Implement `deleteOrLeaveConversation` (xóa/rời)

### Step 3: Conversation Controller - Group Chat
- [ ] Implement `createGroupConversation` (tạo nhóm)
- [ ] Implement `updateGroupName` (đổi tên nhóm)
- [ ] Implement `addGroupMembers` (thêm thành viên)
- [ ] Implement `removeGroupMember` (xóa/rời nhóm)

### Step 4: Conversation Routes
- [ ] Tạo `conversationRoute.ts`
- [ ] Define 9 routes với proper HTTP methods
- [ ] Apply protectedRoute middleware

### Step 5: Message Controller
- [ ] Tạo `messageController.ts`
- [ ] Implement `getMessages` (list messages với pagination)
- [ ] Implement `sendMessage` (gửi tin nhắn + update conversation)
- [ ] Implement `editMessage` (sửa tin nhắn - time limit)
- [ ] Implement `recallMessage` (thu hồi tin nhắn - soft delete)

### Step 6: Message Routes
- [ ] Tạo `messageRoute.ts`
- [ ] Define 4 routes
- [ ] Apply protectedRoute middleware

### Step 7: Register Routes
- [ ] Update `routes/home/index.ts` - import và register routes
- [ ] Test với các endpoints

### Step 8: Helper Functions (Optional)
- [ ] Create `isMemberOfConversation` middleware
- [ ] Create `checkFriendship` helper function (reusable)

---

## 🔍 Validation Points

### Conversations
- ✅ User phải là member mới xem/sửa conversation
- ✅ Direct chat: Phải là bạn bè
- ✅ Group chat: Minimum 3 người, tất cả phải là bạn
- ✅ Chỉ creator mới kick member (trừ tự rời)

### Messages
- ✅ User phải là member của conversation
- ✅ Ít nhất có content hoặc imgUrl
- ✅ Chỉ sender mới edit/recall
- ✅ Edit trong 15 phút
- ✅ Không edit/recall message đã recall

---

## 🎨 Response Format

### Success Response
```typescript
{
  message: "Thành công",
  data: { ... },
  pagination?: { page, limit, total, totalPages }
}
```

### Error Response
```typescript
{
  message: "Lỗi mô tả",
  error?: "Chi tiết lỗi (dev mode)"
}
```

---

## 📊 Business Logic Chi Tiết

### Unread Count Logic
```typescript
// Khi gửi tin nhắn:
- unreadCounts[otherUserId] += 1 (cho tất cả members trừ sender)
- seenBy = [senderId]

// Khi mark as read:
- unreadCounts[currentUserId] = 0
- seenBy.push(currentUserId) nếu chưa có
```

### Last Message Update Logic
```typescript
// Khi gửi tin nhắn mới:
conversation.lastMessage = {
  _id: message._id,
  content: message.content,
  senderId: message.senderId,
  createdAt: message.createdAt
}
conversation.lastMessageAt = new Date()

// Khi recall lastMessage:
- Tìm message trước đó (isRecall = false)
- Update lastMessage với message đó
- Nếu không có message nào: lastMessage = null
```

### Group Member Management
```typescript
// Rời nhóm (tự động):
- Remove user khỏi participants
- Giữ messages cũ (history)
- Nếu creator rời: Chọn creator mới (member đầu tiên) hoặc giải tán nhóm

// Kick member:
- Chỉ creator
- Remove user khỏi participants
```

---

## 🚀 Testing Checklist

### Conversations
- [ ] List conversations với pagination
- [ ] Get conversation by ID
- [ ] Create/Get direct conversation
- [ ] Create group conversation
- [ ] Update group name
- [ ] Add members to group
- [ ] Remove member from group
- [ ] Leave group
- [ ] Mark conversation as read
- [ ] Delete conversation

### Messages
- [ ] Get messages với pagination
- [ ] Send text message
- [ ] Send image message
- [ ] Edit message (trong 15 phút)
- [ ] Recall message
- [ ] Check lastMessage update
- [ ] Check unreadCount update

---

## 📝 Notes

1. **Transaction**: Cần dùng transaction khi update conversation + create message
2. **Populate**: Cẩn thận với nested populate (performance)
3. **Indexes**: Đã có indexes phù hợp trong models
4. **Soft Delete**: Messages dùng isRecall thay vì xóa cứng
5. **WebSocket**: Để sau, hiện tại focus vào REST API trước
6. **Edit Time Limit**: 15 phút (có thể config)
7. **Conversation Deletion**: Direct xóa hẳn, Group chỉ rời

---

## 🎯 Success Criteria

✅ Tất cả endpoints hoạt động đúng
✅ Validation chặt chẽ
✅ Error handling đầy đủ
✅ Không có lỗi TypeScript
✅ unreadCount và lastMessage update chính xác
✅ Pagination hoạt động mượt mà

---

**Bắt đầu từ Step 1: Update Models & Interfaces**
