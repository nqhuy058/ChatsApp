import ChatDetailHeader from '@/components/chats/chat.detail.header';
import MessageBubble from '@/components/chats/message.bubble';
import { getConversationByIdAPI, getMessagesAPI } from '@/utils/api';
import { APP_COLOR } from '@/utils/constant';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
// SỬA: Bỏ import ImageBackground
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const ConversationDetailScreen = () => {
    // ... (toàn bộ phần logic lấy dữ liệu giữ nguyên không đổi)
    const { conversationId } = useLocalSearchParams();
    const [conversation, setConversation] = useState<IConversation | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!conversationId || typeof conversationId !== 'string') {
                setLoading(false);
                return;
            };
            try {
                setLoading(true);
                const [convoRes, messagesRes] = await Promise.all([
                    getConversationByIdAPI(conversationId),
                    getMessagesAPI(conversationId)
                ]);
                if (convoRes?.conversation) {
                    setConversation(convoRes.conversation);
                } else {
                    Toast.show({ type: 'error', text1: 'Không tìm thấy cuộc trò chuyện' });
                }
                if (messagesRes?.messages) {
                    setMessages(messagesRes.messages.reverse());
                }
            } catch (error: any) {
                console.error("Lỗi khi tải dữ liệu chat:", error);
                Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu', text2: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [conversationId]);
    
    // ... (phần code loading và !conversation giữ nguyên không đổi)
    if (loading) {
        return <View style={styles.centeredContainer}><ActivityIndicator size="large" color={APP_COLOR.BLUE} /></View>;
    }
    if (!conversation) {
        return <SafeAreaView style={styles.centeredContainer}><Text>Không thể tải thông tin cuộc trò chuyện.</Text></SafeAreaView>;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <ChatDetailHeader conversation={conversation} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex_1}
                keyboardVerticalOffset={60}
            >
                {/* SỬA: Thay thế ImageBackground bằng View thông thường */}
                <View style={styles.flex_1}>
                    <FlatList
                        data={messages}
                        renderItem={({ item }) => <MessageBubble message={item} />}
                        keyExtractor={(item) => item._id}
                        style={styles.messageList}
                        contentContainerStyle={styles.messageListContent}
                        inverted
                    />
                </View>

                {/* Phần chân màn hình (sẽ làm ở bước sau) */}
                <View style={styles.footer}>
                    <Text>Phần nhập tin nhắn sẽ hiển thị ở đây.</Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ... (phần styles giữ nguyên không đổi)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLOR.WHITE,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flex_1: {
        flex: 1,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        paddingVertical: 10,
    },
    footer: {
        height: 60,
        backgroundColor: APP_COLOR.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 0.5,
        borderTopColor: APP_COLOR.BORDER,
    }
});

export default ConversationDetailScreen;