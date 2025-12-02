import ChatDetailHeader from '@/components/chats/chat.detail.header';
import ChatInput from '@/components/chats/chat.input';
import MessageBubble from '@/components/chats/message.bubble';
import { useAuth } from '@/context/auth.context';
import { getConversationByIdAPI, getMessagesAPI, sendMessageAPI } from '@/utils/api';
import { APP_COLOR } from '@/utils/constant';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const ConversationDetailScreen = () => {
    // ... (phần state và useEffect fetchAllData giữ nguyên không đổi)
    const { conversationId } = useLocalSearchParams();
    const { user: currentUser } = useAuth();
    const [conversation, setConversation] = useState<IConversation | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!conversationId || typeof conversationId !== 'string') return;
            try {
                setLoading(true);
                const [convoRes, messagesRes] = await Promise.all([getConversationByIdAPI(conversationId), getMessagesAPI(conversationId)]);
                if (convoRes?.conversation) setConversation(convoRes.conversation);
                if (messagesRes?.messages) setMessages(messagesRes.messages);
            } catch (error: any) {
                console.error("Lỗi khi tải dữ liệu chat:", error);
                Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu', text2: error.message });
            } finally { setLoading(false); }
        };
        fetchAllData();
    }, [conversationId]);

    // SỬA LỖI TRONG HÀM NÀY
    const handleSendMessage = async (content: string) => {
        if (!conversationId || typeof conversationId !== 'string' || !currentUser) return;

        const tempId = Date.now().toString();
        const optimisticMessage: IMessage = {
            _id: tempId,
            conversationId,
            sender: currentUser,
            content,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        // Thêm tin nhắn vào CUỐI MẢNG
        setMessages(prevMessages => [optimisticMessage, ...prevMessages]);

        try {
            const res = await sendMessageAPI(conversationId, content);

            // THÊM BƯỚC KIỂM TRA QUAN TRỌNG
            if (res && res.newMessage) {
                const realMessage = res.newMessage;
                // Cập nhật tin nhắn trong mảng, vị trí của nó sẽ không thay đổi
                setMessages(prevMessages =>
                    prevMessages.map(msg => (msg._id === tempId ? realMessage : msg))
                );
            } else {
                // Nếu API không trả về tin nhắn mới, coi như là lỗi
                throw new Error("Server did not return a new message.");
            }
        } catch (error) {
            console.error("Lỗi gửi tin nhắn:", error);
            Toast.show({ type: 'error', text1: 'Gửi tin nhắn thất bại' });
            setMessages(prevMessages => prevMessages.filter(msg => msg._id !== tempId));
        }
    };

    // ... (phần giao diện giữ nguyên không đổi)
    if (loading) return <View style={styles.centeredContainer}><ActivityIndicator size="large" color={APP_COLOR.BLUE} /></View>;
    if (!conversation) return <SafeAreaView style={styles.centeredContainer}><Text>Không thể tải thông tin cuộc trò chuyện.</Text></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <ChatDetailHeader conversation={conversation} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex_1}
                keyboardVerticalOffset={60}
            >
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
                <ChatInput onSend={handleSendMessage} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: APP_COLOR.WHITE },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    flex_1: { flex: 1 },
    messageList: { flex: 1 },
    messageListContent: { paddingVertical: 10 },
});

export default ConversationDetailScreen;