# Socket.IO Events Documentation

## Kết nối

### Client → Server

#### Authentication
```javascript
const socket = io("http://localhost:8282", {
  auth: {
    token: "your-jwt-access-token"
  }
});
```

## Events

### 1. User Status Events

#### `user-online` (Server → All Clients)
Khi một user kết nối thành công.
```javascript
socket.on("user-online", ({ userId }) => {
  console.log(`User ${userId} is online`);
});
```

#### `user-offline` (Server → All Clients)
Khi một user ngắt kết nối.
```javascript
socket.on("user-offline", ({ userId }) => {
  console.log(`User ${userId} is offline`);
});
```

---

### 2. Conversation Events

#### `join-conversation` (Client → Server)
Join vào một conversation room để nhận tin nhắn real-time.
```javascript
socket.emit("join-conversation", {
  conversationId: "conversation_id_here"
});
```

#### `leave-conversation` (Client → Server)
Rời khỏi một conversation room.
```javascript
socket.emit("leave-conversation", {
  conversationId: "conversation_id_here"
});
```

---

### 3. Message Events

#### `new-message` (Server → Conversation Room)
Khi có tin nhắn mới trong conversation.
```javascript
socket.on("new-message", ({ conversationId, message }) => {
  console.log("New message:", message);
  // message object contains: _id, senderId, content, imgUrl, createdAt, etc.
});
```

#### `message-updated` (Server → Conversation Room)
Khi tin nhắn được chỉnh sửa hoặc có reaction mới.
```javascript
socket.on("message-updated", ({ conversationId, message }) => {
  console.log("Message updated:", message);
  // Update message in UI
});
```

#### `message-recalled` (Server → Conversation Room)
Khi tin nhắn bị thu hồi.
```javascript
socket.on("message-recalled", ({ conversationId, messageId }) => {
  console.log(`Message ${messageId} was recalled`);
  // Mark message as recalled in UI
});
```

---

### 4. Typing Indicator Events

#### `typing` (Client → Server)
Thông báo user đang gõ tin nhắn.
```javascript
socket.emit("typing", {
  conversationId: "conversation_id_here"
});
```

#### `user-typing` (Server → Other Users in Room)
Nhận thông báo có user đang gõ.
```javascript
socket.on("user-typing", ({ userId, conversationId }) => {
  console.log(`User ${userId} is typing in conversation ${conversationId}`);
  // Show "User is typing..." indicator
});
```

#### `stop-typing` (Client → Server)
Thông báo user đã dừng gõ.
```javascript
socket.emit("stop-typing", {
  conversationId: "conversation_id_here"
});
```

#### `user-stop-typing` (Server → Other Users in Room)
Nhận thông báo user đã dừng gõ.
```javascript
socket.on("user-stop-typing", ({ userId, conversationId }) => {
  console.log(`User ${userId} stopped typing`);
  // Hide "User is typing..." indicator
});
```

---

### 5. Message Seen Events

#### `message-seen` (Client → Server)
Thông báo user đã xem tin nhắn.
```javascript
socket.emit("message-seen", {
  conversationId: "conversation_id_here",
  messageId: "message_id_here"
});
```

#### `message-seen` (Server → Other Users in Room)
Nhận thông báo có user đã xem tin nhắn.
```javascript
socket.on("message-seen", ({ userId, conversationId, messageId }) => {
  console.log(`User ${userId} saw message ${messageId}`);
  // Update seen status in UI
});
```

---

### 6. Conversation Update Events

#### `conversation-updated` (Server → Conversation Room)
Khi conversation được cập nhật (tên, avatar, members, etc).
```javascript
socket.on("conversation-updated", ({ conversation }) => {
  console.log("Conversation updated:", conversation);
  // Update conversation info in UI
});
```

---

### 7. Notification Events

#### `notification` (Server → Specific User)
Khi user nhận được thông báo mới.
```javascript
socket.on("notification", (notification) => {
  console.log("New notification:", notification);
  // notification object contains: type, title, content, relatedUser, etc.
  // Show notification toast/banner
});
```

**Notification Types:**
- `friend_request` - Có lời mời kết bạn mới
- `friend_accept` - Lời mời kết bạn được chấp nhận
- `message` - Tin nhắn mới (khi app không focus)
- `group_invite` - Được mời vào nhóm
- `group_message` - Tin nhắn nhóm mới

---

## Flow Examples

### Sending a Message
```javascript
// 1. Client gửi HTTP POST /api/messages/send
// 2. Server lưu message vào DB
// 3. Server emit "new-message" event to conversation room
// 4. All clients in room nhận event và update UI
```

### Typing Indicator
```javascript
// User starts typing
socket.emit("typing", { conversationId });

// Other users receive
socket.on("user-typing", ({ userId, conversationId }) => {
  // Show "User is typing..."
});

// After 3 seconds of no input, emit stop-typing
socket.emit("stop-typing", { conversationId });
```

### Online Status
```javascript
// On connection - Server automatically:
// 1. Updates user.status = "online" in DB
// 2. Broadcasts "user-online" event

// On disconnect - Server automatically:
// 1. Updates user.status = "offline" and user.lastSeen in DB
// 2. Broadcasts "user-offline" event
```

---

## Error Handling

### Authentication Error
```javascript
socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
  // "Authentication error: No token provided"
  // "Authentication error: Invalid token"
});
```

---

## Best Practices

1. **Join conversation rooms on mount:**
   ```javascript
   useEffect(() => {
     socket.emit("join-conversation", { conversationId });
     return () => {
       socket.emit("leave-conversation", { conversationId });
     };
   }, [conversationId]);
   ```

2. **Debounce typing events:**
   ```javascript
   let typingTimeout;
   const handleTyping = () => {
     socket.emit("typing", { conversationId });
     clearTimeout(typingTimeout);
     typingTimeout = setTimeout(() => {
       socket.emit("stop-typing", { conversationId });
     }, 3000);
   };
   ```

3. **Reconnection handling:**
   ```javascript
   socket.on("connect", () => {
     console.log("Reconnected");
     // Re-join all active conversations
   });
   ```

4. **Cleanup on unmount:**
   ```javascript
   useEffect(() => {
     return () => {
       socket.off("new-message");
       socket.off("user-typing");
       // Remove all listeners
     };
   }, []);
   ```
