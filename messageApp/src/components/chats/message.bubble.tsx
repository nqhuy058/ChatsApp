import { useAuth } from '@/context/auth.context';
import { APP_COLOR } from '@/utils/constant';
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

type MessageBubbleProps = {
    message: IMessage;
};

const MessageBubble = ({ message }: MessageBubbleProps) => {
    const { user: currentUser } = useAuth();

    // SỬA LỖI: Kiểm tra xem message.sender có tồn tại hay không trước khi truy cập
    // Nếu không có sender (ví dụ: người dùng đã bị xóa), coi như đây là tin nhắn của người khác
    if (!message.sender) {
        return (
            <View style={[styles.messageRow, styles.otherMessageRow]}>
                 <Image source={{ uri: 'https://via.placeholder.com/36/cccccc/ffffff?text=?' }} style={styles.avatar} />
                <View style={[styles.bubble, styles.otherBubble]}>
                    <Text style={styles.otherMessageText}>
                        {message.content}
                    </Text>
                </View>
            </View>
        );
    }

    // Từ đây trở đi, chúng ta biết message.sender là một object hợp lệ
    const sender = message.sender;
    const isMyMessage = sender._id === currentUser?._id;

    const avatarUrl = sender.avatarURL || `https://via.placeholder.com/36/007bff/ffffff?text=${(sender.display_name[0] || 'U').toUpperCase()}`;

    return (
        <View style={[
            styles.messageRow,
            isMyMessage ? styles.myMessageRow : styles.otherMessageRow
        ]}>
            {!isMyMessage && (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            )}

            <View style={[
                styles.bubble,
                isMyMessage ? styles.myBubble : styles.otherBubble
            ]}>
                <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
                    {message.content}
                </Text>
            </View>
        </View>
    );
};

// ... (phần styles không thay đổi)
const styles = StyleSheet.create({
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 4,
        marginHorizontal: 8,
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 8,
        backgroundColor: '#E4E6EB',
    },
    bubble: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        maxWidth: '80%',
    },
    myBubble: {
        backgroundColor: APP_COLOR.BLUE,
    },
    otherBubble: {
        backgroundColor: '#E4E6EB',
    },
    myMessageText: {
        color: APP_COLOR.WHITE,
        fontSize: 15,
    },
    otherMessageText: {
        color: APP_COLOR.BLACK,
        fontSize: 15,
    },
});

export default MessageBubble;