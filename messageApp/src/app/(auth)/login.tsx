import ShareButton from "@/components/button/share.button";
import ShareInput from "@/components/input/share.input";
import { APP_COLOR } from "@/utils/constant";
import { LoginSchema } from "@/utils/validate.schema";
import { loginAPI } from "@/utils/api";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Formik } from "formik";
import { useState } from "react";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: APP_COLOR.WHITE,
    },
    keyboardAvoiding: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: APP_COLOR.BLUE,
    },
    logoContainer: {
        flex: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 150,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 32,
        justifyContent: 'space-between',
    },
    form: {
        width: '100%',
        marginTop: 10,
    },
    forgotPassword: {
        textAlign: 'center',
        color: APP_COLOR.BLACK,
        fontWeight: 'bold',
        marginTop: 24,
        fontSize: 15,
    },
    bottomSection: {
        width: '100%',
        paddingTop: 20,
    },
    createAccountButton: {
        borderWidth: 1.5,
        borderColor: APP_COLOR.BLUE_LIGHT,
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
    },
    createAccountText: {
        color: APP_COLOR.BLUE_LIGHT,
        fontWeight: 'bold',
        fontSize: 16,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
});

const LoginPage = () => {
    const [loading, setLoading] = useState(false);

    const handleLogin = async (values: { email: string, password: string }) => {
        setLoading(true);
        const { email, password } = values;

        try {
            const res = await loginAPI(email, password);

            // Sửa ở đây: Kiểm tra sự tồn tại của `res.accessToken`
            if (res && res.accessToken) {
                Toast.show({
                    type: 'success',
                    text1: 'Đăng nhập thành công!'
                });
                // Đăng nhập thành công, lưu access token với đúng tên trường
                await AsyncStorage.setItem('access_token', res.accessToken);

                // Điều hướng đến màn hình chính, không cho quay lại
                router.replace("/(tabs)/chats");
            } else {
                const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
                Toast.show({
                    type: 'error',
                    text1: 'Đăng nhập thất bại',
                    text2: message
                });
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi đăng nhập',
                text2: error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoiding}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        <View style={styles.container}>
                            <View style={styles.logoContainer}>
                                <MaterialCommunityIcons name="facebook-messenger" size={70} color="white" />
                            </View>

                            <Formik
                                validationSchema={LoginSchema}
                                initialValues={{ email: '', password: '' }}
                                onSubmit={handleLogin}
                            >
                                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                    <View style={styles.contentContainer}>
                                        <View style={styles.form}>
                                            <ShareInput
                                                placeholder="Số điện thoại hoặc email"
                                                keyboardType="email-address"
                                                onChangeText={handleChange('email')}
                                                onBlur={handleBlur('email')}
                                                value={values.email}
                                                error={errors.email}
                                                touched={touched.email}
                                            />

                                            <ShareInput
                                                placeholder="Mật khẩu"
                                                secureTextEntry={true}
                                                onChangeText={handleChange('password')}
                                                onBlur={handleBlur('password')}
                                                value={values.password}
                                                error={errors.password}
                                                touched={touched.password}
                                            />

                                            <ShareButton
                                                loading={loading}
                                                tittle="Đăng nhập"
                                                onPress={handleSubmit as any}
                                                textStyle={{
                                                    color: APP_COLOR.WHITE,
                                                    fontSize: 16,
                                                    fontWeight: 'bold',
                                                }}
                                                btnStyle={{
                                                    backgroundColor: APP_COLOR.BLUE_LIGHT,
                                                    borderRadius: 25,
                                                    paddingVertical: 12,
                                                    marginTop: 8
                                                }}
                                            />
                                            <Text style={styles.forgotPassword} onPress={() => router.push("/(auth)/request.password.modal")}>
                                                Quên mật khẩu?
                                            </Text>
                                        </View>

                                        <View style={styles.bottomSection}>
                                            <Pressable style={styles.createAccountButton} onPress={() => router.push("/(auth)/signup.modal")}>
                                                <Text style={styles.createAccountText}>Create new account</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                )}
                            </Formik>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginPage;