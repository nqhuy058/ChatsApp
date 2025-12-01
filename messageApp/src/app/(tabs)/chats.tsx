import ChatItem from '@/components/chats/chat.item';
import { useAuth } from '@/context/auth.context';
import { getConversationsAPI, getFriendsAPI } from '@/utils/api';
import { APP_COLOR } from '@/utils/constant';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react'; // Tối ưu hóa: Thêm useCallback
import { ActivityIndicator, Button, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'; // Cải thiện UX: Thêm RefreshControl
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const ChatsPage = () => {
    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [friends, setFriends] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false); // Cải thiện UX: State cho pull-to-refresh
    const { logout, user } = useAuth();

    // Tối ưu hóa: Bọc logic fetch data trong useCallback để có thể tái sử dụng cho pull-to-refresh
    const fetchData = useCallback(async () => {
        try {
            const [convResponse, friendsResponse] = await Promise.all([
                getConversationsAPI(),
                getFriendsAPI()
            ]);

            // console.log("[ChatsPage] Raw Conversations Response:", JSON.stringify(convResponse, null, 2));
            // console.log("[ChatsPage] Raw Friends Response:", JSON.stringify(friendsResponse, null, 2));

            // SỬA LỖI CỐT LÕI: Truy cập `convResponse.conversations` thay vì `convResponse.data`
            if (convResponse && Array.isArray(convResponse.conversations)) {
                // console.log(`[ChatsPage] Lấy thành công ${convResponse.conversations.length} cuộc trò chuyện.`);
                setConversations(convResponse.conversations);
            } else {
                // console.warn("[ChatsPage] Không có dữ liệu cuộc trò chuyện hoặc có lỗi từ BE:", convResponse?.message);
                setConversations([]);
            }

            // SỬA LỖI CỐT LÕI: Truy cập `friendsResponse.friends` thay vì `friendsResponse.data`
            if (friendsResponse && Array.isArray(friendsResponse.friends)) {
                // console.log(`[ChatsPage] Lấy thành công ${friendsResponse.friends.length} bạn bè.`);
                setFriends(friendsResponse.friends);
            } else {
                // console.warn("[ChatsPage] Không có dữ liệu bạn bè hoặc có lỗi từ BE:", friendsResponse?.message);
                setFriends([]);
            }

        } catch (error: any) {
            // console.error("[ChatsPage] Lỗi nghiêm trọng khi fetch dữ liệu:", error.message || error);

            if (error?.message === "Token đã hết hạn") {
                Toast.show({
                    type: 'error',
                    text1: 'Phiên đăng nhập hết hạn',
                    text2: 'Vui lòng đăng nhập lại.',
                    visibilityTime: 4000
                });
                // console.warn("[ChatsPage] Token đã hết hạn. Đang tự động đăng xuất...");
                logout();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi tải dữ liệu',
                    text2: error?.message || "Không thể tải dữ liệu chat.",
                    visibilityTime: 4000
                });
            }
        }
    }, [logout]);

    // Effect để fetch data lần đầu
    useEffect(() => {
        const initialFetch = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };
        initialFetch();
    }, [fetchData]);

    // Cải thiện UX: Thêm chức năng Pull-to-Refresh (kéo để làm mới)
    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchData();
        setIsRefreshing(false);
    }, [fetchData]);

    const handleLogout = async () => {
        await logout();
        Toast.show({ type: 'info', text1: 'Đã đăng xuất.' });
    };

    const HomeHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.logo}>messenger</Text>
            <View style={styles.headerIcons}>
                <Pressable style={styles.iconWrapper}><Feather name="edit" size={24} color={APP_COLOR.BLACK} /></Pressable>
                <Pressable style={styles.iconWrapper}><FontAwesome name="facebook-square" size={24} color={APP_COLOR.BLACK} /></Pressable>
            </View>
        </View>
    );

    // Tối ưu hóa hiệu năng: Bọc render function trong useCallback
    const renderOnlineFriend = useCallback(({ item }: { item: IUser }) => (
        <View style={styles.friendAvatarContainer}>
            <View>
                {/* Sửa: Dùng avatarURL từ log thay vì avatar, và cung cấp placeholder nếu null/undefined */}
                <Image
                    source={{ uri: item.avatarURL || 'https://via.placeholder.com/60/007bff/ffffff?text=' + (item.display_name?.[0]?.toUpperCase() || 'U') }}
                    style={styles.friendAvatar}
                />
                {item.status === 'online' && <View style={styles.onlineDot} />}
            </View>
            <Text style={styles.friendName} numberOfLines={2}>{item.display_name}</Text>
        </View>
    ), []);

    // Tối ưu hóa hiệu năng: Bọc render function trong useCallback
    const renderConversationItem = useCallback(({ item }: { item: IConversation }) => (
        <ChatItem conversation={item} />
    ), []);

    const ListHeaderComponent = () => (
        <>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={APP_COLOR.GREY} style={styles.searchIcon} />
                <TextInput placeholder="Ask Meta AI or Search" style={styles.searchInput} placeholderTextColor={APP_COLOR.GREY} />
            </View>
            <View style={{ marginVertical: 10 }}>
                <FlatList
                    data={friends}
                    renderItem={renderOnlineFriend}
                    keyExtractor={item => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 11 }}
                />
            </View>
            <View style={styles.filterContainer}>
                <Pressable style={[styles.chip, styles.chipActive]}><Text style={[styles.chipText, styles.chipTextActive]}>All</Text></Pressable>
                <Pressable style={styles.chip}><Text style={styles.chipText}>Unread</Text></Pressable>
                <Pressable style={styles.chip}><Text style={styles.chipText}>Groups</Text></Pressable>
            </View>
        </>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={APP_COLOR.BLUE} />
                <Text style={{ marginTop: 10 }}>Đang tải dữ liệu...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <HomeHeader />
            <Button title="Đăng xuất" onPress={handleLogout} color="red" />
            {user && <Text style={{ textAlign: 'center', marginVertical: 5 }}>Bạn đã đăng nhập: {user.display_name} ({user.user_name})</Text>}

            {conversations.length === 0 && !loading ? (
                <View style={styles.emptyStateContainer}>
                    <Ionicons name="chatbubbles-outline" size={60} color={APP_COLOR.GREY} />
                    <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
                    <Text style={styles.emptySubText}>Hãy bắt đầu nhắn tin hoặc kéo xuống để làm mới.</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversationItem}
                    keyExtractor={item => item._id}
                    ListHeaderComponent={ListHeaderComponent}
                    // Cải thiện UX: Thêm RefreshControl
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[APP_COLOR.BLUE]} />
                    }
                />
            )}
            <Pressable style={styles.fab}>
                <Ionicons name="chatbubble-ellipses-outline" size={28} color={APP_COLOR.WHITE} />
            </Pressable>
        </SafeAreaView>
    );
};

// ... (phần styles không thay đổi, giữ nguyên như cũ)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLOR.WHITE
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: APP_COLOR.BLACK,
        textAlign: 'center',
    },
    emptySubText: {
        marginTop: 4,
        fontSize: 14,
        color: APP_COLOR.GREY,
        textAlign: 'center',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: APP_COLOR.WHITE
    },
    logo: {
        fontSize: 30,
        fontWeight: 'bold',
        color: APP_COLOR.BLUE
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 16
    },
    iconWrapper: {},
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderRadius: 20,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        height: 40
    },
    searchIcon: {
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: APP_COLOR.BLACK
    },
    friendAvatarContainer: {
        alignItems: 'center',
        width: 70,
        marginHorizontal: 5
    },
    friendAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30
    },
    noteAvatar: {
        backgroundColor: '#E4E6EB'
    },
    noteAddIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: APP_COLOR.WHITE,
        borderRadius: 10
    },
    onlineDot: {
        width: 15,
        height: 15,
        borderRadius: 8,
        backgroundColor: '#31A24C',
        position: 'absolute',
        bottom: 2,
        right: 2,
        borderWidth: 2,
        borderColor: APP_COLOR.WHITE
    },
    friendName: {
        marginTop: 6,
        fontSize: 13,
        color: APP_COLOR.GREY,
        textAlign: 'center'
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#CED0D4'
    },
    chip: {
        backgroundColor: '#E4E6EB',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20
    },
    chipActive: {
        backgroundColor: '#E7F3FF'
    },
    chipText: {
        fontWeight: '500',
        color: APP_COLOR.BLACK
    },
    chipTextActive: {
        color: APP_COLOR.BLUE
    },
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
        marginRight: 12
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
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: APP_COLOR.BLUE_LIGHT,
        elevation: 5
    }
});

export default ChatsPage;