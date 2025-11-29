import { APP_COLOR } from '@/utils/constant';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

// Lấy props là một object conversation
const ChatItem = ({ conversation }: { conversation: IConversation }) => {
    // TODO: Xử lý logic để lấy thông tin người đối diện (cho chat 1-1)
    // và xử lý hiển thị cho chat group
    const displayName = conversation.isGroup ? conversation.groupName : "Tên người dùng";
    const avatarUrl = conversation.isGroup ? conversation.groupAvatar : "https://via.placeholder.com/60"; // Thay bằng avatar người dùng

    // TODO: Định dạng lại thời gian và tin nhắn cuối cùng
    const lastMessage = conversation.lastMessage?.content ?? "Chưa có tin nhắn.";
    const time = new Date(conversation.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    // TODO: Xử lý logic unread
    const isUnread = true;

    return (
        <Pressable style={styles.chatItemContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.chatAvatar} />
            <View style={styles.chatContent}>
                <Text style={[styles.chatName, isUnread && styles.unreadText]}>{displayName}</Text>
                <Text style={[styles.chatMessage, isUnread && styles.unreadText]} numberOfLines={1}>
                    {lastMessage} · {time}
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