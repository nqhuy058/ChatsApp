import ChatItem from '@/components/chats/chat.item';
import { getConversationsAPI, getFriendsAPI } from '@/utils/api';
import { APP_COLOR } from '@/utils/constant';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatsPage = () => {
    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [friends, setFriends] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Gọi API song song để tăng tốc độ
                const [convRes, friendsRes] = await Promise.all([
                    getConversationsAPI(),
                    getFriendsAPI()
                ]);

                if (convRes && convRes.data) {
                    setConversations(convRes.data);
                }
                if (friendsRes && friendsRes.data) {
                    setFriends(friendsRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                // Có thể hiển thị Toast lỗi ở đây
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const HomeHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.logo}>messenger</Text>
            <View style={styles.headerIcons}>
                <Pressable style={styles.iconWrapper}><Feather name="edit" size={24} color={APP_COLOR.BLACK} /></Pressable>
                <Pressable style={styles.iconWrapper}><FontAwesome name="facebook-square" size={24} color={APP_COLOR.BLACK} /></Pressable>
            </View>
        </View>
    );

    const renderOnlineFriend = ({ item }: { item: IUser }) => (
        <View style={styles.friendAvatarContainer}>
            <View>
                {/* Sử dụng avatarURL từ API */}
                <Image source={{ uri: item.avatar ?? 'https://via.placeholder.com/60' }} style={styles.friendAvatar} />
                {/* TODO: Cập nhật logic isOnline dựa vào trường 'status' của user */}
                {item.status === 'online' && <View style={styles.onlineDot} />}
            </View>
            <Text style={styles.friendName} numberOfLines={2}>{item.display_name}</Text>
        </View>
    );

    const ListHeader = () => (
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
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <HomeHeader />
            <FlatList
                data={conversations}
                // Sử dụng component ChatItem mới
                renderItem={({ item }) => <ChatItem conversation={item} />}
                keyExtractor={item => item._id}
                ListHeaderComponent={ListHeader}
            />
            <Pressable style={styles.fab}>
                <Ionicons name="chatbubble-ellipses-outline" size={28} color={APP_COLOR.WHITE} />
            </Pressable>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLOR.WHITE
    },
    // Header
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
    // Search
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
    // Online Friends
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
    // Filters
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
    // Chat Item
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
    // FAB
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