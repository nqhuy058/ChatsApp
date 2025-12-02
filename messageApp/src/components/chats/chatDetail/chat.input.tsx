import { APP_COLOR } from '@/utils/constant';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Platform } from 'react-native';

type ChatInputProps = {
    onSend: (message: string) => void;
};

const ChatInput = ({ onSend }: ChatInputProps) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim().length > 0) {
            onSend(message.trim());
            setMessage(''); // Xóa nội dung input sau khi gửi
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                {/* Các nút chức năng sẽ thêm sau */}
                <Pressable style={styles.iconButton}>
                    <Ionicons name="add-circle-outline" size={28} color={APP_COLOR.GREY} />
                </Pressable>

                <TextInput
                    style={styles.textInput}
                    placeholder="Tin nhắn..."
                    value={message}
                    onChangeText={setMessage}
                    multiline
                />

                {/* Nút gửi chỉ hiển thị khi có nội dung */}
                {message.trim().length > 0 ? (
                    <Pressable style={styles.sendButton} onPress={handleSend}>
                        <Ionicons name="send" size={24} color={APP_COLOR.WHITE} />
                    </Pressable>
                ) : (
                    <Pressable style={styles.iconButton}>
                        <Ionicons name="happy-outline" size={28} color={APP_COLOR.GREY} />
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: APP_COLOR.WHITE,
        borderTopWidth: 0.5,
        borderTopColor: APP_COLOR.BORDER,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5', // Màu nền ô input
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        paddingHorizontal: 8,
        maxHeight: 100, // Giới hạn chiều cao khi gõ nhiều dòng
    },
    iconButton: {
        padding: 4,
    },
    sendButton: {
        backgroundColor: APP_COLOR.BLUE,
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default ChatInput;