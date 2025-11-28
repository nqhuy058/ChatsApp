import { APP_COLOR } from "@/utils/constant";
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import React from 'react';

const TabLayout = () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: APP_COLOR.BLUE,
                tabBarLabelStyle: {
                    fontSize: 11,
                }
            }}
        >
            <Tabs.Screen
                name="chats"
                options={{
                    title: "Chats",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubbles" size={size} color={color} />
                    ),
                    tabBarBadge: 6, // Ví dụ: số tin nhắn chưa đọc
                }}
            />

            <Tabs.Screen
                name="friends"
                options={{
                    title: "Friends",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="notification"
                options={{
                    title: "Notifications",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="notifications" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: "Menu",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="menu" size={size} color={color} />
                    ),
                    tabBarBadge: '●', // Dấu chấm đỏ thông báo
                    tabBarBadgeStyle: {
                        fontSize: 8,
                        backgroundColor: 'transparent',
                        color: 'red',
                        lineHeight: 12,
                        top: 3, // Căn chỉnh vị trí dấu chấm
                    }
                }}
            />

        </Tabs>
    )
}
export default TabLayout;