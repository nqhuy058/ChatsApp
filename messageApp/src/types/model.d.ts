export { };

declare global {
    // Cấu trúc chung cho response từ backend (Giữ lại để tham khảo)
    interface IBackendRes<T> {
        error?: string | string[];
        message: string | string[];
        statusCode: number | string;
        data?: T;
    }

    // Kiểu dữ liệu cho người dùng (Đảm bảo nó đầy đủ)
    interface IUser {
        _id: string;
        user_name: string;
        display_name: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        avatarURL?: string | null;
        status?: 'online' | 'offline';
        lastSeen?: string;
    }

    interface IUserLogin {
        message: string;
        accessToken: string;
        user: IUser;
    }
    
    interface IRegister {} // Giữ lại để các hàm khác không lỗi
    
    interface IVerifyOtpRes {
        message: string;
        resetToken: string;
    }

    // Cấu trúc cho một đối tượng Participant trong Conversation (như trong log)
    interface IConversationParticipant {
      userId: IUser;
      joinedAt: string;
    }

    // Cấu trúc cho một tin nhắn cuối cùng
    interface ILastMessage {
        content: string | null;
        createdAt: string | null;
    }

    // Cấu trúc cho một cuộc trò chuyện
    interface IConversation {
        _id: string;
        type: "direct" | "group";
        participants: IConversationParticipant[];
        lastMessage: ILastMessage | null;
        unreadCount?: number;
        groupName?: string;
        groupAvatar?: string;
        updatedAt: string;
    }

    // MỚI: KIỂU DỮ LIỆU CHÍNH XÁC cho phản hồi từ API /api/home/conversations
    interface IConversationsAPIResponse {
        message: string;
        conversations: IConversation[]; // Dữ liệu nằm trong trường 'conversations'
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }

    // MỚI: KIỂU DỮ LIỆU CHÍNH XÁC cho phản hồi từ API /api/home/friends
    interface IFriendsAPIResponse {
        message: string;
        friends: IUser[]; // Dữ liệu nằm trong trường 'friends'
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }

       interface IMessage {
        _id: string;
        conversationId: string;
        // 'sender' có thể là object IUser (khi populate) hoặc string ID (khi chưa populate)
        sender?: IUser | string; 
        // Vẫn giữ 'senderId' để tương thích với dữ liệu backend hiện tại
        senderId?: string; 
        content: string;
        type?: 'text' | 'image' | 'video' | 'audio' | 'file'; // Đặt optional nếu có thể thiếu
        isRecall?: boolean; // Từ log
        reactions?: { // Từ log
            userId: string;
            type: string;
            createdAt?: Date; // Có thể optional
        }[];
        createdAt: string; // ISO Date string
        updatedAt: string; // ISO Date string
        __v?: number; // Từ log
    }

}

