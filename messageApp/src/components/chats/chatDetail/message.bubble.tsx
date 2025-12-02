import { useAuth } from '@/context/auth.context';
import { APP_COLOR } from '@/utils/constant';
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

type MessageBubbleProps = {
    message: IMessage; // Sử dụng IMessage đã được sửa đổi
};

const MessageBubble = ({ message }: MessageBubbleProps) => {
    const { user: currentUser } = useAuth();

    // --- DEBUGGING LOGS (Hãy giữ lại để kiểm tra) ---
    // console.log("--- DEBUGGING MESSAGE BUBBLE - FINAL FLEXIBLE LOGIC ---");
    // console.log("Current User from Context:", JSON.stringify(currentUser, null, 2));
    // console.log("Full Message Object (received by frontend):", JSON.stringify(message, null, 2));
    // --- KẾT THÚC DEBUGGING LOGS ---

    let actualSenderId: string | undefined;
    let senderDisplayInfo: IUser | undefined; // Sẽ chứa object IUser đầy đủ nếu có

    // Logic để xác định senderId và senderDisplayInfo từ message
    // Ưu tiên 1: message.sender là object (đã populate)
    if (typeof message.sender === 'object' && message.sender !== null && '_id' in message.sender) {
        senderDisplayInfo = message.sender as IUser;
        actualSenderId = senderDisplayInfo._id;
    }
    // Ưu tiên 2: message.sender là string ID (chưa populate)
    else if (typeof message.sender === 'string') {
        actualSenderId = message.sender;
        // Không có senderDisplayInfo đầy đủ, sẽ dùng placeholder avatar
    }
    // Ưu tiên 3: message.senderId tồn tại (khi backend gửi theo kiểu cũ)
    else if (message.senderId) {
        actualSenderId = message.senderId;
        // Không có senderDisplayInfo đầy đủ, sẽ dùng placeholder avatar
    }

    const currentUserId = currentUser?._id;

    // Log các giá trị để chúng ta thấy quá trình quyết định
    // console.log(`Extracted Sender ID: |${actualSenderId}| (Type: ${typeof actualSenderId})`);
    // console.log(`Current User ID:     |${currentUserId}| (Type: ${typeof currentUserId})`);
    const isMyMessage = !!(actualSenderId && currentUserId && actualSenderId === currentUserId);
    // console.log(`>>> Comparison Result (isMyMessage): ${isMyMessage}`);
    // console.log("---------------------------------------------------\n");

    // Xác định URL avatar
    let avatarUrl = senderDisplayInfo?.avatarURL || `https://via.placeholder.com/36/cccccc/ffffff?text=${(senderDisplayInfo?.display_name?.[0] || 'U').toUpperCase()}`;
    if (!senderDisplayInfo && actualSenderId) {
        // Nếu không có object sender đầy đủ nhưng có ID, dùng placeholder với chữ cái đầu của ID
        avatarUrl = `https://via.placeholder.com/36/cccccc/ffffff?text=${(actualSenderId[0] || 'U').toUpperCase()}`;
    }


    // Nếu không có thông tin currentUser hoặc không thể xác định sender, render một bubble trung lập
    if (!currentUser || !actualSenderId) {
        return (
            <View style={[styles.messageRow, styles.otherMessageRow]}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} /> {/* Luôn hiển thị avatar placeholder */}
                <View style={[styles.bubble, styles.otherBubble]}>
                    <Text style={styles.otherMessageText}>
                        {message.content}
                    </Text>
                </View>
            </View>
        );
    }

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