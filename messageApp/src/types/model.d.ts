export { };

declare global {
    // Cấu trúc chung cho response từ backend
    interface IBackendRes<T> {
        accessToken: IBackendRes<IUserLogin>;
        error?: string | string[];
        message: string | string[] | any; // Sửa `any` để khớp với BE
        statusCode: number | string;
        data?: T;
    }

    // Kiểu dữ liệu cho người dùng
    interface IUser {
        _id: string;
        user_name: string;
        email: string;
        first_name: string;
        last_name: string;
        avatar?: string;
        display_name: string;
        status?: 'online' | 'offline'; // 2. Thêm dòng này
        lastSeen?: string;
    }

    // Kiểu dữ liệu trả về khi đăng ký thành công
    interface IRegister {
        user: IUser;
    }

    // Kiểu dữ liệu trả về khi đăng nhập thành công
    interface IUserLogin {
        message: string;
        accessToken: string; // Sửa tên trường thành camelCase
        user: IUser;
    }

    interface IVerifyOtpRes {
        message: string;
        resetToken: string;
    }

    // Cấu trúc cho một tin nhắn cuối cùng trong cuộc trò chuyện
    interface ILastMessage {
        _id: string;
        sender: string; // User ID
        content: string;
        createdAt: string; // ISO Date string
    }

    // Cấu trúc cho một cuộc trò chuyện
    interface IConversation {
        _id: string;
        participants: IUser[];
        lastMessage: ILastMessage;
        isGroup: boolean;
        groupName?: string;
        groupAvatar?: string;
        updatedAt: string; // ISO Date string
    }
}