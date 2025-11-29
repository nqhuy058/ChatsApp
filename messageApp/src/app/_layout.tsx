import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from "react-native-root-siblings";
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from "@/context/auth.context"; // Import AuthProvider và useAuth
import { ActivityIndicator, View } from "react-native";

// Component này chứa logic điều hướng dựa trên trạng thái đăng nhập
const InitialLayout = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const navTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: 'white',
        },
    };

    useEffect(() => {
        // Bỏ qua logic nếu context vẫn đang load token từ storage
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        // Nếu đã đăng nhập và đang ở màn hình auth (login/signup),
        // chuyển hướng vào trong app (màn hình chats)
        if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)/chats');
        }
        // Nếu chưa đăng nhập và đang ở ngoài màn hình auth,
        // chuyển hướng ra màn hình login
        else if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, isLoading, segments]);

    // Trong khi đang kiểm tra token, hiển thị màn hình loading
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    // Khi đã load xong, hiển thị Stack Navigator của bạn
    return (
        <ThemeProvider value={navTheme}>
            <Stack>
                <Stack.Screen
                    name="index"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="(auth)/login"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="(auth)/signup.modal"
                    options={{
                        headerShown: false,
                        presentation: "transparentModal",
                    }}
                />
                <Stack.Screen
                    name="(auth)/request.password.modal"
                    options={{
                        headerShown: false,
                        presentation: "transparentModal",
                    }}
                />
                <Stack.Screen
                    name="(auth)/forgot.password.modal"
                    options={{
                        headerShown: false,
                        presentation: "transparentModal",
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                />
            </Stack>
        </ThemeProvider>
    );
};

// Component gốc, bọc tất cả mọi thứ
const RootLayout = () => {
    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <RootSiblingParent>
                <AuthProvider>
                    <InitialLayout />
                </AuthProvider>
                <Toast />
            </RootSiblingParent>
        </GestureHandlerRootView>
    );
}

export default RootLayout;