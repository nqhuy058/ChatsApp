/**
 * Express Request types mở rộng
 * File này giúp TypeScript hiểu các property custom đã thêm vào Request
 */

import { Request } from "express";
import { IUser } from "../models/User.js";

/**
 * AuthRequest - Request đã qua authentication middleware
 * Có thêm property `user` chứa thông tin user đã đăng nhập
 */
export interface AuthRequest extends Request {
  user?: IUser;  // Optional vì một số route không cần auth
}