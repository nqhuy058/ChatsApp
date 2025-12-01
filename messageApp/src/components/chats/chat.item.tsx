import { useAuth } from '@/context/auth.context'; // Tối ưu hóa: Import useAuth để lấy thông tin người dùng
import { APP_COLOR } from '@/utils/constant';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const ChatItem = ({ conversation }: { conversation: IConversation }) => {
    // Lấy thông tin user hiện tại từ AuthContext để xác định "người kia" là ai
    const { user: currentUser } = useAuth();

    // SỬA LỖI & TỐI ƯU HÓA: Logic để lấy thông tin hiển thị chính xác
    let displayName = "Unknown User";
    let avatarUrl = "https://via.placeholder.com/60"; // Placeholder mặc định

    if (conversation.type === 'group') {
        displayName = conversation.groupName || "Nhóm chat";
        avatarUrl = conversation.groupAvatar || `https://via.placeholder.com/60/808080/FFFFFF?text=G`;
    } else if (currentUser) {
        // Với chat 1-1, tìm người tham gia không phải là user hiện tại
        // Dựa trên log, `participants` là một mảng object có `userId` bên trong.
        const otherParticipant = conversation.participants.find(
            p => p.userId._id !== currentUser._id
        );
        
        if (otherParticipant && otherParticipant.userId) {
            const otherUser = otherParticipant.userId; // Đây là object IUser của người kia
            displayName = otherUser.display_name || otherUser.user_name;
            // Cải thiện UX: Dùng avatarURL và có placeholder đẹp hơn nếu không có avatar
            avatarUrl = otherUser.avatarURL || `https://via.placeholder.com/60/007bff/ffffff?text=${(displayName[0] || 'U').toUpperCase()}`;
        } else if (conversation.participants.length === 1) {
            // Cải thiện UX: Xử lý trường hợp đặc biệt (trò chuyện với chính mình)
            displayName = "Ghi chú cho chính bạn";
            avatarUrl = currentUser.avatarURL || `https://via.placeholder.com/60/007bff/ffffff?text=${(currentUser.display_name[0] || 'U').toUpperCase()}`;
        }
    }

    // SỬA LỖI & TỐI ƯU HÓA: Xử lý tin nhắn cuối cùng và thời gian
    const lastMessageContent = conversation.lastMessage?.content ?? "Bắt đầu cuộc trò chuyện";
    const lastMessageTime = conversation.lastMessage?.createdAt
        ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : ''; // Nếu không có createdAt, không hiển thị thời gian

    // SỬA LỖI: Xử lý logic unread dựa trên dữ liệu từ backend
    // Log cho thấy có `unreadCount`, chúng ta sẽ dùng nó.
    const isUnread = !!conversation.unreadCount && conversation.unreadCount > 0;

    return (
        <Pressable style={styles.chatItemContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.chatAvatar} />
            <View style={styles.chatContent}>
                <Text style={[styles.chatName, isUnread && styles.unreadText]} numberOfLines={1}>
                    {displayName}
                </Text>
                <Text style={[styles.chatMessage, isUnread && styles.unreadText]} numberOfLines={1}>
                    {lastMessageContent}{lastMessageTime ? ` · ${lastMessageTime}` : ''}
                </Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    chatItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    chatAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
        backgroundColor: '#E4E6EB'
    },
    chatContent: {
        flex: 1
    },
    chatName: {
        fontSize: 17,
        fontWeight: '500',
        color: APP_COLOR.BLACK
    },
    chatMessage: {
        fontSize: 15,
        color: '#65676B'
    },
    unreadText: {
        fontWeight: 'bold',
        color: APP_COLOR.BLACK
    }
});

export default ChatItem;