import axios from "@/utils/axios.customize";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const registerAPI = (data: {
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    user_name: string
}) => {
    const url = `/api/auth/register`;
    return axios.post<IBackendRes<IRegister>>(url, data);
}

export const loginAPI = (email_or_username: string, password: string) => {
    const url = `/api/auth/login`;
    return axios.post<IUserLogin>(url, { user_name: email_or_username, password });
}

// 1. API yêu cầu gửi mã OTP
export const requestPasswordResetAPI = (email: string) => {
    const url = `/api/auth/forgot-password`;
    return axios.post<IBackendRes<{ otp?: string }>>(url, { email });
}

// 2. API xác thực mã OTP, trả về resetToken
export const verifyOtpAPI = (email: string, otp: string) => {
    const url = `/api/auth/verify-otp`;
    // Bỏ IBackendRes<> vì response không có cấu trúc đó
    return axios.post<IVerifyOtpRes>(url, { email, otp });
}

// 3. API đặt lại mật khẩu mới, dùng resetToken
export const resetPasswordAPI = (token: string, new_password: string) => {
    const url = `/api/auth/reset-password`;
    return axios.post<IBackendRes<any>>(url, { token, new_password });
}

// Lấy danh sách tất cả cuộc trò chuyện của người dùng
export const getConversationsAPI = () => {
    const url = `/api/home/conversations`;
    // SỬA: Dùng kiểu IConversationsAPIResponse thay vì IBackendRes<...>
    return axios.get<IConversationsAPIResponse>(url);
}

// Lấy danh sách bạn bè của người dùng
export const getFriendsAPI = () => {
    const url = `/api/home/friends`;
    // SỬA: Dùng kiểu IFriendsAPIResponse thay vì IBackendRes<...>
    return axios.get<IFriendsAPIResponse>(url);
}
