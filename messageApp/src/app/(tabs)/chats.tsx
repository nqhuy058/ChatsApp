import { APP_COLOR } from '@/utils/constant';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- DỮ LIỆU GIẢ (MOCK DATA) ---
// Thay thế bằng ảnh trong thư mục assets của bạn
const onlineFriendsData = [
    { id: 'note', name: 'Leave a note', avatar: require('@/assets/images/avatar-me.jpg'), isNote: true },
    { id: '1', name: 'Nguyễn', avatar: require('@/assets/images/avatar1.jpg'), isOnline: true },
    { id: '2', name: 'Toan', avatar: require('@/assets/images/avatar2.jpg'), isOnline: true },
    { id: '3', name: 'Mạnh Lê', avatar: require('@/assets/images/avatar3.jpg') },
    { id: '4', name: 'Vân', avatar: require('@/assets/images/avatar4.jpg'), isOnline: true },
    { id: '5', name: 'Nguyễn Mai', avatar: require('@/assets/images/avatar5.jpg') },
];

const chatListData = [
    { id: '1', name: '7', avatar: require('@/assets/images/avatar-group.jpg'), lastMessage: '3 new messages', time: '3:22 PM', isUnread: true },
    { id: '2', name: '12h trưa anh ko làm a chết', avatar: require('@/assets/images/avatar2.jpg'), lastMessage: 'M thì chứ a thì đâu', time: '3:18 PM', isUnread: true },
    { id: '3', name: 'pà xã iuu ❤️', avatar: require('@/assets/images/avatar1.jpg'), lastMessage: 'Reacted 😍 to your message', time: '3:15 PM', isUnread: false },
    { id: '4', name: 'Mạnh Lê', avatar: require('@/assets/images/avatar3.jpg'), lastMessage: 'You: ❤️', time: '1:44 PM', isUnread: false },
    { id: '5', name: 'Nguyễn Mai', avatar: require('@/assets/images/avatar5.jpg'), lastMessage: 'Reacted ❤️ to your message', time: '11:33 AM', isUnread: false },
    { id: '6', name: 'Đinh Đức Thiện', avatar: require('@/assets/images/avatar-me.jpg'), lastMessage: 'You: thế a k mang', time: '7:56 PM', isUnread: false },
    { id: '7', name: 'Nguyễn Hà', avatar: require('@/assets/images/avatar4.jpg'), lastMessage: 'The video call ended.', time: '7:52 PM', isUnread: false },
];
// --- KẾT THÚC DỮ LIỆU GIẢ ---


const ChatsPage = () => {
    // --- COMPONENT CON TRONG FILE ---

    // Header cố định
    const HomeHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.logo}>messenger</Text>
            <View style={styles.headerIcons}>
                <Pressable style={styles.iconWrapper}>
                    <Feather name="edit" size={24} color={APP_COLOR.BLACK} />
                </Pressable>
                <Pressable style={styles.iconWrapper}>
                    <FontAwesome name="facebook-square" size={24} color={APP_COLOR.BLACK} />
                </Pressable>
            </View>
        </View>
    );

    // Render item cho danh sách bạn bè online
    const renderOnlineFriend = ({ item }: { item: typeof onlineFriendsData[0] }) => (
        <View style={styles.friendAvatarContainer}>
            <View>
                <Image source={item.avatar} style={[styles.friendAvatar, item.isNote && styles.noteAvatar]} />
                {item.isOnline && <View style={styles.onlineDot} />}
                {item.isNote && <Ionicons name="add" size={20} color={APP_COLOR.BLACK} style={styles.noteAddIcon} />}
            </View>
            <Text style={styles.friendName} numberOfLines={2}>{item.name}</Text>
        </View>
    );

    // Render item cho danh sách chat
    const renderChatItem = ({ item }: { item: typeof chatListData[0] }) => (
        <Pressable style={styles.chatItemContainer}>
            <Image source={item.avatar} style={styles.chatAvatar} />
            <View style={styles.chatContent}>
                <Text style={[styles.chatName, item.isUnread && styles.unreadText]}>{item.name}</Text>
                <Text style={[styles.chatMessage, item.isUnread && styles.unreadText]} numberOfLines={1}>
                    {item.lastMessage} · {item.time}
                </Text>
            </View>
            {/* Bạn có thể thêm icon đã xem ở đây */}
        </Pressable>
    );

    // Phần header của FlatList (thanh search, bạn bè online, filter)
    const ListHeader = () => (
        <>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={APP_COLOR.GREY} style={styles.searchIcon} />
                <TextInput
                    placeholder="Ask Meta AI or Search"
                    style={styles.searchInput}
                    placeholderTextColor={APP_COLOR.GREY}
                />
            </View>
            <View style={{ marginVertical: 10 }}>
                <FlatList
                    data={onlineFriendsData}
                    renderItem={renderOnlineFriend}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 11 }}
                />
            </View>
            <View style={styles.filterContainer}>
                <Pressable style={[styles.chip, styles.chipActive]}>
                    <Text style={[styles.chipText, styles.chipTextActive]}>All</Text>
                </Pressable>
                <Pressable style={styles.chip}>
                    <Text style={styles.chipText}>Unread</Text>
                </Pressable>
                <Pressable style={styles.chip}>
                    <Text style={styles.chipText}>Groups</Text>
                </Pressable>
            </View>
        </>
    );

    // --- GIAO DIỆN CHÍNH ---
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <HomeHeader />
            <FlatList
                data={chatListData}
                renderItem={renderChatItem}
                keyExtractor={item => item.id}
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