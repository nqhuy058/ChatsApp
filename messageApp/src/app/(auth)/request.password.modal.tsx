import ShareButton from "@/components/button/share.button";
import ShareInput from "@/components/input/share.input";
import { APP_COLOR } from "@/utils/constant";
import { RequestPasswordSchema } from "@/utils/validate.schema";
import { requestPasswordResetAPI } from "@/utils/api";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

const RequestPasswordModal = () => {
    const [loading, setLoading] = useState(false);

    const handleRequestPassword = async (values: { email: string }) => {
        setLoading(true);
        try {
            const res = await requestPasswordResetAPI(values.email);
            
            if (res && res.message) {
                // Điều hướng đến màn hình nhập OTP và truyền email theo
                router.push({ pathname: '/(auth)/forgot.password.modal', params: { email: values.email } });
            }
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message ?? "Đã có lỗi xảy ra.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={APP_COLOR.BLACK} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.innerContainer}>
                            <Text style={styles.title}>Khôi phục mật khẩu</Text>
                            <Text style={styles.subtitle}>Nhập vào địa chỉ email của bạn.</Text>

                            <Formik
                                initialValues={{ email: '' }}
                                validationSchema={RequestPasswordSchema}
                                onSubmit={handleRequestPassword}
                            >
                                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                    <>
                                        <ShareInput
                                            placeholder="Email"
                                            keyboardType="email-address"
                                            onChangeText={handleChange('email')}
                                            onBlur={handleBlur('email')}
                                            value={values.email}
                                            error={errors.email}
                                            touched={touched.email}
                                        />

                                        <ShareButton
                                            tittle="Tiếp tục"
                                            onPress={handleSubmit as any}
                                            loading={loading}
                                            btnStyle={styles.button}
                                            textStyle={styles.buttonText}
                                        />
                                    </>
                                )}
                            </Formik>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLOR.WHITE,
    },
    header: {
        paddingTop: 10,
        paddingHorizontal: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    innerContainer: {
        paddingHorizontal: 24,
        paddingTop: '10%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        color: APP_COLOR.BLACK,
    },
    subtitle: {
        fontSize: 16,
        color: APP_COLOR.GREY,
        marginBottom: 24,
    },
    button: {
        backgroundColor: APP_COLOR.BLUE_LIGHT,
        borderRadius: 25,
        paddingVertical: 14,
        marginTop: 16,
    },
    buttonText: {
        color: APP_COLOR.WHITE,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default RequestPasswordModal;