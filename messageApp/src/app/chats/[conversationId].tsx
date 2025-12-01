import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import {  Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ConversationDetailScreen = () => {
    // Lấy tham số `conversationId` từ URL
    const { conversationId } = useLocalSearchParams();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Chi tiết cuộc trò chuyện</Text>
                <Text style={styles.text}>
                    ID của cuộc trò chuyện này là:
                </Text>
                <Text style={styles.idText}>
                    {conversationId}
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
    },
    idText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#007AFF',
    }
});

export default ConversationDetailScreen;