import { useAuth } from '@/context/auth.context';
import { APP_COLOR } from '@/utils/constant';
import { Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';

// THAY ĐỔI: Định nghĩa props cho ChatDetailHeader để nhận hàm formatLastSeen
interface ChatDetailHeaderProps {
    conversation: IConversation;
    formatLastSeen: (dateString: string | Date) => string; // <--- THÊM PROP NÀY
}

const ChatDetailHeader = ({ conversation, formatLastSeen }: ChatDetailHeaderProps) => { // <--- NHẬN PROP NÀY
    const { user: currentUser } = useAuth();

    let displayName = "Loading...";
    let avatarUrl = "https://via.placeholder.com/40";
    let activityStatus = "Đang tải..."; // Trạng thái mặc định

    if (currentUser && conversation) {
         if (conversation.type === 'group') {
            displayName = conversation.groupName || "Nhóm chat";
            avatarUrl = conversation.groupAvatar || `https://via.placeholder.com/40/808080/FFFFFF?text=G`;
            activityStatus = `${conversation.participants.length} thành viên`;
        } else {
            const otherParticipant = conversation.participants.find(p => p.userId._id !== currentUser._id);
            if (otherParticipant?.userId) {
                const otherUser = otherParticipant.userId;
                displayName = otherUser.display_name;
                avatarUrl = otherUser.avatarURL || `https://via.placeholder.com/40/007bff/ffffff?text=${(displayName[0] || 'U').toUpperCase()}`;
                
                // THAY ĐỔI: Dùng status và lastSeen thực tế để tính toán activityStatus
                if (otherUser.status === 'online') {
                    activityStatus = 'Đang hoạt động';
                } else if (otherUser.lastSeen) {
                    activityStatus = formatLastSeen(otherUser.lastSeen); // <--- SỬ DỤNG HÀM formatLastSeen
                } else {
                    activityStatus = 'Chưa rõ trạng thái'; // Fallback nếu không có lastSeen
                }
            }
        }
    }
    
    return (
        <View style={styles.container}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color={APP_COLOR.BLACK} />
            </Pressable>

            <Image source={{ uri: avatarUrl }} style={styles.avatar} />

            <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
                <Text style={styles.userStatus} numberOfLines={1}>{activityStatus}</Text>
            </View>

            <View style={styles.actions}>
                <Pressable style={styles.actionButton}>
                    <SimpleLineIcons name="info" size={24} color={APP_COLOR.BLACK} />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        height: 60,
        backgroundColor: APP_COLOR.WHITE,
        borderBottomWidth: 0.5,
        borderBottomColor: '#CED0D4',
        paddingLeft: 4,
        paddingRight: 10
    },
    backButton: {
        paddingHorizontal: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#E4E6EB',
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
    },
    userStatus: {
        fontSize: 13,
        color: APP_COLOR.GREY,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {},
});

export default ChatDetailHeader;