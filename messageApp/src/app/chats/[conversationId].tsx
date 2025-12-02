import ChatDetailHeader from '@/components/chats/chatDetail/chat.detail.header';
import ChatInput from '@/components/chats/chatDetail/chat.input';
import MessageBubble from '@/components/chats/chatDetail/message.bubble';
import { useAuth } from '@/context/auth.context';
import { getConversationByIdAPI, getMessagesAPI, sendMessageAPI } from '@/utils/api';
import { APP_COLOR } from '@/utils/constant';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8282';

const ConversationDetailScreen = () => {
    const { conversationId } = useLocalSearchParams();
    const { user: currentUser, token } = useAuth();
    const [conversation, setConversation] = useState<IConversation | null>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<any>(null);

    // Hàm helper để định dạng thời gian hoạt động cuối cùng
    const formatLastSeen = useCallback((dateString: string | Date): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffSeconds < 60) {
            return 'Đang hoạt động';
        } else if (diffSeconds < 3600) {
            const minutes = Math.floor(diffSeconds / 60);
            return `Hoạt động ${minutes} phút trước`;
        } else if (diffSeconds < 86400) {
            const hours = Math.floor(diffSeconds / 3600);
            return `Hoạt động ${hours} giờ trước`;
        } else if (diffSeconds < 604800) {
            const days = Math.floor(diffSeconds / 86400);
            return `Hoạt động ${days} ngày trước`;
        } else {
            return `Hoạt động ${date.toLocaleDateString('vi-VN')} lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
        }
    }, []);

    // Helper để kiểm tra nếu ID là một optimistic temporary ID (chỉ là số và có độ dài nhất định)
    const isOptimisticTempId = useCallback((id: string) => {
        return /^\d+$/.test(id) && id.length > 10 && id.length < 16; // MongoDB ID ~24 ký tự hex. Date.now() ~13-14 chữ số
    }, []);

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
        if (!token) {
            console.warn("Frontend: Authentication token is missing, skipping socket connection.");
            return;
        }

        const newSocket = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            auth: {
                token: token
            },
            query: { userId: currentUser._id }
        });

        newSocket.on('connect', () => {

        });

        newSocket.on('new-message', ({ conversationId: receivedConversationId, message: newMessage }: { conversationId: string, message: IMessage }) => {
            if (receivedConversationId === conversationId) {
                setMessages(prevMessages => {
                    let updatedMessages = [...prevMessages];

                    // FIX TypeScript error: Safely check sender before accessing _id
                    const isCurrentUserMessageFromSocket = currentUser &&
                        newMessage.sender &&
                        typeof newMessage.sender === 'object' &&
                        '_id' in newMessage.sender &&
                        (newMessage.sender as IUser)._id === currentUser._id;

                    // 1. Tìm và CẬP NHẬT tin nhắn nếu đã tồn tại với cùng _ID
                    const existingMessageIndex = updatedMessages.findIndex(msg => msg._id === newMessage._id);

                    if (existingMessageIndex !== -1) {
                        // Nếu tin nhắn với ID này đã tồn tại, CẬP NHẬT nó
                        updatedMessages[existingMessageIndex] = newMessage;
                    } else if (isCurrentUserMessageFromSocket) {
                        // 2. Nếu là tin nhắn của người dùng hiện tại (có ID thật từ backend)
                        // và chưa có tin nhắn với ID này, HÃY TÌM và THAY THẾ tin nhắn lạc quan (optimistic)
                        const optimisticMessageIndex = updatedMessages.findIndex(
                            msg => isOptimisticTempId(msg._id) &&
                                (msg.sender as IUser)?._id === currentUser._id && // Đảm bảo sender là object
                                msg.content === newMessage.content // So khớp nội dung để chắc chắn là cùng một tin nhắn
                        );

                        if (optimisticMessageIndex !== -1) {
                            // Thay thế tin nhắn lạc quan bằng tin nhắn thật từ socket
                            updatedMessages[optimisticMessageIndex] = newMessage;
                        } else {
                            // Nếu không tìm thấy tin nhắn lạc quan để thay thế, chỉ thêm tin nhắn này vào
                            // Điều này có thể xảy ra nếu API response nhanh hơn socket và đã thay thế rồi,
                            // hoặc đây là một tin nhắn mới hoàn toàn.
                            updatedMessages.unshift(newMessage);
                        }
                    } else {
                        // 3. Tin nhắn từ người dùng khác, chỉ thêm vào danh sách
                        updatedMessages.unshift(newMessage);
                    }

                    // Sắp xếp lại mảng để đảm bảo thứ tự đúng (mới nhất lên đầu)
                    return updatedMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                });
            } else {
                
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

        newSocket.on('user-status-update', ({ userId, status, lastSeen }: { userId: string, status: 'online' | 'offline', lastSeen?: string }) => {
            setConversation(prevConvo => {
                if (!prevConvo || prevConvo.type === 'group' || !currentUser) {
                    return prevConvo;
                }

                const otherParticipantIndex = prevConvo.participants.findIndex(
                    p => p.userId._id === userId && p.userId._id !== currentUser._id
                );

                if (otherParticipantIndex !== -1) {
                    const updatedParticipants = [...prevConvo.participants];
                    updatedParticipants[otherParticipantIndex] = {
                        ...updatedParticipants[otherParticipantIndex],
                        userId: {
                            ...updatedParticipants[otherParticipantIndex].userId,
                            status: status,
                            lastSeen: lastSeen || updatedParticipants[otherParticipantIndex].userId.lastSeen
                        }
                    };
                    return { ...prevConvo, participants: updatedParticipants };
                }
                return prevConvo;
            });
        });

        newSocket.on('disconnect', () => {
        });

        newSocket.on('connect_error', (error: any) => {
            Toast.show({ type: 'error', text1: 'Lỗi kết nối Real-time', text2: error.message });
        });

        socketRef.current = newSocket;

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [conversationId, currentUser?._id, token, formatLastSeen, isOptimisticTempId]);

    // Effect để tải dữ liệu chat ban đầu
    useEffect(() => {
        const fetchAllData = async () => {
            if (!conversationId || typeof conversationId !== 'string') return;
            try {
                setLoading(true);
                const [convoRes, messagesRes] = await Promise.all([getConversationByIdAPI(conversationId), getMessagesAPI(conversationId)]);
                if (convoRes?.conversation) setConversation(convoRes.conversation);

                if (messagesRes?.messages) {
                    setMessages(prevMessages => {
                        const newFetchedMessages = messagesRes.messages;
                        const uniqueMessages = new Map<string, IMessage>();

                        prevMessages.forEach(msg => uniqueMessages.set(msg._id, msg));
                        newFetchedMessages.forEach(msg => uniqueMessages.set(msg._id, msg));

                        return Array.from(uniqueMessages.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    });
                }
            } catch (error: any) {
                Toast.show({ type: 'error', text1: 'Lỗi tải dữ liệu', text2: error.message });
            } finally { setLoading(false); }
        };
        fetchAllData();
    }, [conversationId]);

    const handleSendMessage = async (content: string) => {
        if (!conversationId || typeof conversationId !== 'string' || !currentUser || !token) {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể gửi tin nhắn do thiếu thông tin xác thực.' });
            return;
        }

        const tempId = Date.now().toString(); // Temporary ID for optimistic update
        const optimisticMessage: IMessage = {
            _id: tempId,
            conversationId,
            sender: currentUser,
            content,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setMessages(prevMessages => [optimisticMessage, ...prevMessages]);

        try {
            const res = await sendMessageAPI(conversationId, content);

            if (res && res.newMessage) {
                const realMessage = res.newMessage;
                // Cập nhật tin nhắn trong mảng, thay thế optimistic message bằng real message
                setMessages(prevMessages =>
                    prevMessages.map(msg => (msg._id === tempId ? realMessage : msg))
                );
            } else {
                throw new Error("Server did not return a new message.");
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Gửi tin nhắn thất bại' });
            // Nếu gửi lỗi, xóa tin nhắn optimistic
            setMessages(prevMessages => prevMessages.filter(msg => msg._id !== tempId));
        }
    };

    if (loading) return <View style={styles.centeredContainer}><ActivityIndicator size="large" color={APP_COLOR.BLUE} /></View>;
    if (!conversation) return <SafeAreaView style={styles.centeredContainer}><Text>Không thể tải thông tin cuộc trò chuyện.</Text></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <ChatDetailHeader conversation={conversation} formatLastSeen={formatLastSeen} />
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