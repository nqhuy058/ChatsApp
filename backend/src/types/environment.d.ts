/**
 * Type definitions cho Environment Variables
 * File này giúp TypeScript hiểu các biến môi trường trong process.env
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server Configuration
      PORT?: string;                    // Port server chạy (VD: '3000', '8080')
      NODE_ENV?: 'development' | 'production' | 'test';  // Môi trường chạy

      // Database
      MONGO_URI?: string;               // Connection string MongoDB
      DB_NAME?: string;                 // Tên database

      // Authentication & Security
      JWT_SECRET?: string;              // Secret key cho JWT
      JWT_EXPIRES_IN?: string;          // Thời gian hết hạn token (VD: '7d', '1h')
      BCRYPT_ROUNDS?: string;           // Số rounds hash password (VD: '10')

      // External APIs (ví dụ)
      API_KEY?: string;                 // API key cho service ngoài
      API_URL?: string;                 // Base URL cho API

      // Email Service (nếu có)
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;

      // Frontend URL (cho CORS)
      CLIENT_URL?: string;              // URL frontend (VD: 'http://localhost:5173')

      // Cloud Storage (nếu dùng)
      AWS_ACCESS_KEY?: string;
      AWS_SECRET_KEY?: string;
      AWS_BUCKET_NAME?: string;

      // Other
      LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';  // Mức độ logging
    }
  }
}

export { };
