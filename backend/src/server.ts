import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectDB } from './libs/db.js';
import authRoute from './routes/auth/index.js';
import homeRoute from './routes/home/index.js';
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddleware.js';
import { initializeSocket } from './libs/socket.js';

dotenv.config();

// --- THÊM DÒNG KIỂM TRA NÀY VÀO ĐÂY ---
// console.log('--- DIAGNOSTIC CHECK ---');
// console.log('ACCESS_TOKEN_SECRET IS:', process.env.ACCESS_TOKEN_SECRET);
// console.log('------------------------');

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8282;

// Initialize Socket.IO
export const io = initializeSocket(httpServer);

// Export getIO function for controllers
export const getIO = () => io;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Public Routes
app.use('/api/auth', authRoute);

// Private Routes (Cần đăng nhập)
app.use(protectedRoute);
app.use('/api/home', homeRoute);

// Connect to database
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
    console.log(`Socket.IO đã sẵn sàng`);
  });
});
