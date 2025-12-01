import { useAuth } from '@/context/auth.context';
import { APP_COLOR } from '@/utils/constant';
import { Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';

const ChatDetailHeader = ({ conversation }: { conversation: IConversation }) => {
    const { user: currentUser } = useAuth();

    // Logic tìm người đối diện (tương tự như trong ChatItem)
    let displayName = "Loading...";
    let avatarUrl = "https://via.placeholder.com/40";
    let activityStatus = "";

    if (currentUser && conversation) {
         if (conversation.type === 'group') {
            displayName = conversation.groupName || "Nhóm chat";
            avatarUrl = conversation.groupAvatar || `https://via.placeholder.com/40/808080/FFFFFF?text=G`;
            activityStatus = `${conversation.participants.length} thành viên`;
        } else {
            // Tìm người tham gia không phải là user hiện tại
            const otherParticipant = conversation.participants.find(p => p.userId._id !== currentUser._id);
            if (otherParticipant?.userId) {
                const otherUser = otherParticipant.userId;
                displayName = otherUser.display_name;
                avatarUrl = otherUser.avatarURL || `https://via.placeholder.com/40/007bff/ffffff?text=${(displayName[0] || 'U').toUpperCase()}`;
                // Tạm thời hiển thị trạng thái, sẽ cải thiện sau với real-time socket
                activityStatus = otherUser.status === 'online' ? 'Đang hoạt động' : `Hoạt động 5 phút trước`; 
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
                {/* Chỉ giữ lại nút Info vì backend chưa có chức năng gọi điện */}
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