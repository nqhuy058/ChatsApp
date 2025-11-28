import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Conversation from "../models/Convesation";

interface AuthSocket extends Socket {
  userId?: string;
}

interface OnlineUser {
  userId: string;
  socketId: string;
}

// Store online users
const onlineUsers: OnlineUser[] = [];

/**
 * Khởi tạo Socket.IO server
 */
export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Middleware xác thực socket connection
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: string };
      socket.userId = decoded.userId;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection handler
  // Connection handler
  // ... imports

  io.on("connection", async (socket: AuthSocket) => {
    const userId = socket.userId!;

    // --- 🔍 LOG DEBUG KẾT NỐI ---
    console.log(`🔌 [CONNECT] User: ${userId} | SocketID: ${socket.id}`);

    // Check xem user này đã có bao nhiêu kết nối trước đó
    const existingSockets = onlineUsers.filter(u => u.userId === userId);
    if (existingSockets.length > 0) {
      console.warn(`⚠️ User ${userId} đang có ${existingSockets.length} kết nối cũ chưa thoát!`, existingSockets.map(s => s.socketId));
    }
    // -----------------------------

    onlineUsers.push({ userId, socketId: socket.id });

    // ... (Code update DB, emit user-online... giữ nguyên) ...
    // ... Copy logic cũ vào đây ...
    // ... Nhớ giữ đoạn io.emit("user-status-update", ...) ...

    // 1. Emit danh sách online users mới nhất
    const uniqueUserIds = [...new Set(onlineUsers.map(u => u.userId))];
    io.emit("getOnlineUsers", uniqueUserIds);

    // ...

    socket.on("disconnect", async () => {
      // --- 🔍 LOG DEBUG NGẮT KẾT NỐI ---
      console.log(`❌ [DISCONNECT] User: ${userId} | SocketID: ${socket.id}`);

      const index = onlineUsers.findIndex((u) => u.socketId === socket.id);
      if (index !== -1) {
        onlineUsers.splice(index, 1);
        console.log(`✅ Đã xóa socket ${socket.id}. Còn lại ${onlineUsers.length} user online.`);
      } else {
        console.error(`😱 LỖI MA: Không tìm thấy socket ${socket.id} trong danh sách onlineUsers!`);
      }

      // Check xem user này còn kết nối nào khác không?
      const remainingSockets = onlineUsers.filter(u => u.userId === userId);
      if (remainingSockets.length > 0) {
        console.warn(`👻 User ${userId} VẪN CÒN ${remainingSockets.length} kết nối khác! (Chưa offline hoàn toàn)`);
        // Nếu vẫn còn kết nối khác, ta KHÔNG gửi sự kiện offline
        return;
      }
      // -----------------------------------

      // Nếu code chạy xuống đây nghĩa là HẾT SẠCH kết nối -> Offline thật sự
      console.log(`💤 User ${userId} đã offline hoàn toàn.`);

      const lastSeenNow = new Date();

      try {
        await User.findByIdAndUpdate(userId, {
          status: "offline",
          lastSeen: lastSeenNow,
        });
      } catch (error) {
        console.error("Update user status error:", error);
      }

      const uniqueUserIds = [...new Set(onlineUsers.map(u => u.userId))];
      io.emit("getOnlineUsers", uniqueUserIds);

      io.emit("user-status-update", {
        userId,
        status: "offline",
        lastSeen: lastSeenNow
      });
    });

    /**
     * Disconnect handler
     */
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId} (${socket.id})`);

      // Remove user from online users
      const index = onlineUsers.findIndex((u) => u.socketId === socket.id);
      if (index !== -1) {
        onlineUsers.splice(index, 1);
      }

      // Lấy giờ hiện tại lúc ngắt kết nối
      const lastSeenNow = new Date();

      // Update user status to offline
      try {
        await User.findByIdAndUpdate(userId, {
          status: "offline",
          lastSeen: lastSeenNow, // Lưu giờ offline chính xác vào DB
        });
      } catch (error) {
        console.error("Update user status error:", error);
      }

      // 1. Emit danh sách online users mới nhất
      const uniqueUserIds = [...new Set(onlineUsers.map(u => u.userId))];
      io.emit("getOnlineUsers", uniqueUserIds);

      // 2. 🔥 THÊM MỚI: Báo cho toàn bộ Client biết User này vừa Offline lúc mấy giờ
      // Client sẽ dùng biến 'lastSeen' này để hiển thị "Hoạt động X phút trước" chuẩn xác
      io.emit("user-status-update", {
        userId,
        status: "offline",
        lastSeen: lastSeenNow
      });
    });
  });
  return io;
};









/**
 * Helper: Emit new message event (SỬA LẠI)
 * Thay vì bắn vào room conversation (user chưa join sẽ tạch),
 * ta bắn vào từng room cá nhân của người nhận.
 */
export const emitNewMessage = (
  io: SocketIOServer,
  conversationId: string,
  message: any,
  receiverIds: string[] // <--- THÊM THAM SỐ NÀY
) => {
  // Bắn cho từng người nhận (bao gồm cả người gửi để update UI realtime nếu họ mở nhiều tab)
  receiverIds.forEach(userId => {
    io.to(userId).emit("new-message", {
      conversationId,
      message,
    });
  });
};

/**
 * Helper: Emit message updated event (SỬA LẠI)
 */
export const emitMessageUpdated = (
  io: SocketIOServer,
  conversationId: string,
  message: any,
  receiverIds: string[] // <--- THÊM
) => {
  receiverIds.forEach(userId => {
    io.to(userId).emit("message-updated", {
      conversationId,
      message,
    });
  });
};

/**
 * Helper: Emit message recalled event (SỬA LẠI)
 */
export const emitMessageRecalled = (
  io: SocketIOServer,
  conversationId: string,
  messageId: string,
  receiverIds: string[] // <--- THÊM
) => {
  receiverIds.forEach(userId => {
    io.to(userId).emit("message-recalled", {
      conversationId,
      messageId,
    });
  });
};

/**
 * Helper: Emit conversation updated event
 */
export const emitConversationUpdated = (
  io: SocketIOServer,
  conversationId: string,
  conversation: any
) => {
  io.to(`conversation:${conversationId}`).emit("conversation-updated", {
    conversation,
  });
};

/**
 * Helper: Emit notification to specific user
 */
export const emitNotification = (
  io: SocketIOServer,
  userId: string,
  notification: any
) => {
  io.to(userId).emit("notification", notification);
};

/**
 * Helper: Emit friend request cancelled event
 */
export const emitFriendRequestCancelled = (
  io: SocketIOServer,
  requestId: string,
  receiverId: string
) => {
  io.to(receiverId).emit("friend-request-cancelled", { requestId });
};

/**
 * Helper: Emit friend request declined event
 */
export const emitFriendRequestDeclined = (
  io: SocketIOServer,
  requestId: string,
  senderId: string
) => {
  io.to(senderId).emit("friend-request-declined", { requestId });
};

/**
 * Helper: Emit friend request accepted event
 */
export const emitFriendRequestAccepted = (
  io: SocketIOServer,
  requestId: string,
  senderId: string,
  receiverId: string
) => {
  io.to(senderId).emit("friend-request-accepted", { requestId });
  io.to(receiverId).emit("friend-request-accepted", { requestId });
};

/**
 * Helper: Get online users
 */
export const getOnlineUsers = () => {
  return onlineUsers.map((u) => u.userId);
};

/**
 * Helper: Check if user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.some((u) => u.userId === userId);
};

/**
 * Helper: Emit new conversation event
 */
export const emitNewConversation = (
  io: SocketIOServer,
  conversation: any,
  participantIds: string[]
) => {
  participantIds.forEach(userId => {
    io.to(userId).emit("new-conversation", { conversation });
  });
};
