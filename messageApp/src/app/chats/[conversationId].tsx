import ChatDetailHeader from '@/components/chats/chat.detail.header';
import ChatInput from '@/components/chats/chat.input';
import MessageBubble from '@/components/chats/message.bubble';
import { useAuth } from '@/context/auth.context';
import { getConversationByIdAPI, getMessagesAPI, sendMessageAPI } from '@/utils/api';
import { APP_COLOR } from '@/utils/constant';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8282'; 

const ConversationDetailScreen = () => {
    // ... (phần state và useEffect fetchAllData giữ nguyên không đổi)
    const { conversationId } = useLocalSearchParams();
    const { user: currentUser, token } = useAuth();
    const [conversation, setConversation] = useState<IConversation | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<any>(null); 

     // Effect để thiết lập kết nối Socket.IO và lắng nghe sự kiện
    useEffect(() => {
        if (!conversationId || typeof conversationId !== 'string') {
            console.warn("Frontend: conversationId is missing or invalid, skipping socket setup.");
            return;
        }
        if (!currentUser?._id) {
             console.warn("Frontend: currentUser is missing, skipping socket setup.");
             return;
        }
        if (!token) { // Kiểm tra token trước khi kết nối Socket.IO
            console.warn("Frontend: Authentication token is missing, skipping socket connection.");
            return;
        }

        console.log(`Frontend: Attempting to connect to Socket.IO at ${SOCKET_SERVER_URL}`);
        const newSocket = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            auth: {
                token: token // TRUYỀN TOKEN XÁC THỰC
            },
            query: { userId: currentUser._id }
        });

        newSocket.on('connect', () => {
            console.log('Frontend: Socket.IO Connected!');
        });

        newSocket.on('new-message', ({ conversationId: receivedConversationId, message: newMessage }: { conversationId: string, message: IMessage }) => {
            console.log('Frontend: Received new message via Socket.IO:', newMessage);
            if (receivedConversationId === conversationId) {
                setMessages(prevMessages => {
                    // Kiểm tra trùng lặp để tránh thêm tin nhắn 2 lần
                    if (prevMessages.some(msg => msg._id === newMessage._id)) {
                        return prevMessages;
                    }
                    // Thêm tin nhắn mới vào ĐẦU MẢNG vì FlatList là inverted
                    return [newMessage, ...prevMessages];
                });
            } else {
                console.log(`Frontend: Received message for other conversation (${receivedConversationId}). Current: ${conversationId}`);
            }
        });
        
        newSocket.on('message-updated', ({ conversationId: receivedConversationId, message: updatedMessage }: { conversationId: string, message: IMessage }) => {
            if (receivedConversationId === conversationId) {
                setMessages(prevMessages =>
                    prevMessages.map(msg => (msg._id === updatedMessage._id ? updatedMessage : msg))
                );
            }
        });

        newSocket.on('message-recalled', ({ conversationId: receivedConversationId, messageId }: { conversationId: string, messageId: string }) => {
            if (receivedConversationId === conversationId) {
                setMessages(prevMessages => prevMessages.map(msg =>
                    msg._id === messageId ? { ...msg, content: "Tin nhắn đã bị thu hồi", isRecall: true } : msg
                ));
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Frontend: Socket.IO Disconnected!');
        });

        newSocket.on('connect_error', (error: any) => {
            console.error('Frontend: Socket.IO Connection Error:', error);
            Toast.show({ type: 'error', text1: 'Lỗi kết nối Real-time', text2: error.message });
        });

        socketRef.current = newSocket;

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                console.log('Frontend: Socket.IO Disconnected during cleanup.');
                socketRef.current = null;
            }
        };
    }, [conversationId, currentUser?._id, token]);
    
    // Effect để tải dữ liệu chat ban đầu
    useEffect(() => {
        const fetchAllData = async () => {
            if (!conversationId || typeof conversationId !== 'string') return;
            try {
                setLoading(true);
                const [convoRes, messagesRes] = await Promise.all([getConversationByIdAPI(conversationId), getMessagesAPI(conversationId)]);
                if (convoRes?.conversation) setConversation(convoRes.conversation);
                
                if (messagesRes?.messages) {
                    // THAY ĐỔI TẠI ĐÂY: Hợp nhất và loại bỏ trùng lặp tin nhắn để tránh lỗi "same key"
                    setMessages(prevMessages => {
                        const newFetchedMessages = messagesRes.messages;
                        const uniqueMessages = new Map<string, IMessage>();
                        
                        // Thêm các tin nhắn hiện có từ state trước (ví dụ: optimistic message hoặc tin nhắn nhận qua socket trước khi fetch xong)
                        // Giữ lại chúng và nếu có tin nhắn mới trùng ID, tin nhắn mới sẽ ghi đè.
                        prevMessages.forEach(msg => uniqueMessages.set(msg._id, msg));
                        
                        // Thêm các tin nhắn mới được tải về từ API, ghi đè nếu ID đã tồn tại
                        // Điều này đảm bảo các tin nhắn từ API (có _id thật) sẽ là phiên bản chính xác nhất.
                        newFetchedMessages.forEach(msg => uniqueMessages.set(msg._id, msg));
                        
                        // Chuyển Map thành mảng, sắp xếp từ mới nhất đến cũ nhất
                        return Array.from(uniqueMessages.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    });
                }
            } catch (error: any) {
                console.error("Lỗi khi tải dữ liệu chat:", error);
                Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu', text2: error.message });
            } finally { setLoading(false); }
        };
        fetchAllData();
    }, [conversationId]); // Dependency chỉ vào conversationId cho lần tải ban đầu

    // SỬA LỖI TRONG HÀM handleSendMessage
    const handleSendMessage = async (content: string) => {
        // THAY ĐỔI TẠI ĐÂY: Thêm kiểm tra token để tránh lỗi "jwt malformed"
        if (!conversationId || typeof conversationId !== 'string' || !currentUser || !token) { 
            console.error("Frontend: Missing conversationId, currentUser, or token for sending message.");
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể gửi tin nhắn do thiếu thông tin xác thực.' });
            return;
        }

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
        // Thêm tin nhắn vào ĐẦU MẢNG vì FlatList là inverted
        setMessages(prevMessages => [optimisticMessage, ...prevMessages]);

        try {
            const res = await sendMessageAPI(conversationId, content);

            if (res && res.newMessage) {
                const realMessage = res.newMessage;
                // Cập nhật tin nhắn trong mảng, vị trí của nó sẽ không thay đổi
                setMessages(prevMessages =>
                    prevMessages.map(msg => (msg._id === tempId ? realMessage : msg))
                );
            } else {
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