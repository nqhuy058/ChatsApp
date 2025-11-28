import { Document, Model } from "mongoose";

/**
 * Interface cho Session object trong User
 */
export interface ISession {
  refreshToken: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt?: Date;
}

/**
 * Interface định nghĩa structure của User document
 */
export interface IUser extends Document {
  user_name: string;
  email: string;
  hash_password: string;
  display_name: string;
  normalized_display_name?: string; // Field tự động tạo để search không dấu
  avatarURL?: string;
  avatarID?: string;
  bio?: string;
  phone?: string;
  status?: "online" | "offline" | "away";
  lastSeen?: Date;
  sessions: ISession[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  resetPasswordOTP?: string;
  resetPasswordOTPExpires?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Khai báo method custom
  removeExpiredSessions(): Promise<void>;
}

/**
 * Interface mở rộng cho Model với custom methods (Statics)
 */
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}
