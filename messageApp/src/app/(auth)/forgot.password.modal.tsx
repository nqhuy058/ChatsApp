import ShareButton from "@/components/button/share.button";
import ShareInput from "@/components/input/share.input";
import { APP_COLOR } from "@/utils/constant";
import { ForgotPasswordSchema } from "@/utils/validate.schema";
import { resetPasswordAPI, requestPasswordResetAPI, verifyOtpAPI } from "@/utils/api";
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

const ForgotPasswordModal = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    // Lấy email được truyền từ màn hình trước
    const { email } = useLocalSearchParams<{ email: string }>();

    const handleConfirmCode = async (values: any) => {
        setLoading(true);
        const { code, password } = values;

        if (!email) {
            Alert.alert("Lỗi", "Không tìm thấy email. Vui lòng thử lại từ đầu.");
            setLoading(false);
            return;
        }

        try {
            // --- BƯỚC 1: Xác thực OTP để lấy resetToken ---
            const verifyRes = await verifyOtpAPI(email, code);

            if (verifyRes && verifyRes.data?.resetToken) {
                const resetToken = verifyRes.data.resetToken;

                // --- BƯỚC 2: Dùng resetToken để đặt lại mật khẩu ---
                const resetRes = await resetPasswordAPI(resetToken, password);

                if (resetRes && resetRes.statusCode === 200) {
                    Alert.alert('Thành công', resetRes.message as string);
                    // Quay lại màn hình đăng nhập (2 lần back)
                    router.back();
                    router.back();
                } else {
                    Alert.alert("Lỗi", Array.isArray(resetRes.message) ? resetRes.message.join(', ') : resetRes.message);
                }

            } else {
                Alert.alert("Lỗi", Array.isArray(verifyRes.message) ? verifyRes.message.join(', ') : verifyRes.message);
            }
        } catch (error: any) {
            Alert.alert("Lỗi", error?.message ?? "Đã có lỗi xảy ra.");
        } finally {
            setLoading(false);
        }
    };

    // Xử lý gửi lại mã
    const handleResendCode = async () => {
        if (!email) return;
        try {
            const res = await requestPasswordResetAPI(email);
            Alert.alert("Thông báo", res.message as string);
        } catch (error: any) {
            Alert.alert("Lỗi", "Không thể gửi lại mã.");
        }
    }
    
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
                            <Text style={styles.title}>Xác nhận tài khoản</Text>
                            <Text style={styles.subtitle}>
                                Chúng tôi đã gửi mã tới <Text style={{ fontWeight: 'bold' }}>{email}</Text>. Vui lòng nhập mã đó để xác nhận tài khoản của bạn.
                            </Text>
                            <Formik
                                initialValues={{ code: '', password: '', confirmPassword: '' }}
                                validationSchema={ForgotPasswordSchema}
                                onSubmit={handleConfirmCode}
                            >
                                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                    <>
                                        <ShareInput
                                            placeholder="Nhập mã"
                                            keyboardType="number-pad"
                                            onChangeText={handleChange('code')}
                                            onBlur={handleBlur('code')}
                                            value={values.code}
                                            error={errors.code}
                                            touched={touched.code}
                                        />
                                        <ShareInput
                                            placeholder="Mật khẩu mới"
                                            secureTextEntry
                                            onChangeText={handleChange('password')}
                                            onBlur={handleBlur('password')}
                                            value={values.password}
                                            error={errors.password}
                                            touched={touched.password}
                                        />
                                        <ShareInput
                                            placeholder="Xác nhận mật khẩu mới"
                                            secureTextEntry
                                            onChangeText={handleChange('confirmPassword')}
                                            onBlur={handleBlur('confirmPassword')}
                                            value={values.confirmPassword}
                                            error={errors.confirmPassword}
                                            touched={touched.confirmPassword}
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

                            <Pressable style={styles.resendContainer} onPress={handleResendCode}>
                                <Text style={styles.resendText}>Gửi lại mã</Text>
                            </Pressable>
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
        paddingTop: '5%',
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
        lineHeight: 22,
    },
    image: {
        width: '100%',
        height: 150,
        marginBottom: 24,
        alignSelf: 'center',
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
    resendContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    resendText: {
        color: APP_COLOR.BLUE_LIGHT,
        fontWeight: 'bold',
        fontSize: 15,
    }
});

export default ForgotPasswordModal;