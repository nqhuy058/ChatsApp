import { Redirect } from "expo-router";

const RootPage = () => {
    // Component này không render gì cả.
    // Nó chỉ làm một việc: chuyển hướng người dùng.
    // Logic trong _layout.tsx sẽ "bắt" lấy sự kiện chuyển hướng này
    // và quyết định xem nên cho người dùng đến '/(tabs)/chats' (nếu đã đăng nhập)
    // hay đến '/(auth)/login' (nếu chưa đăng nhập).
    return (
       <Redirect href="/(tabs)/chats" />
    );
}

export default RootPage;