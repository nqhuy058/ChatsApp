import ShareButton from "@/components/button/share.button";
import ShareInput from "@/components/input/share.input";
import { APP_COLOR } from "@/utils/constant";
import { SignUpSchema } from "@/utils/validate.schema";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { registerAPI } from "@/utils/api";
import Toast from "react-native-toast-message";

const SignUpModal = () => {
    const [loading, setLoading] = useState(false);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    // State tạm để lưu ngày tháng khi picker đang mở
    const [tempDate, setTempDate] = useState(new Date());

    const handleSignUp = async (values: any) => {
        setLoading(true);
        const { firstName, lastName, email, password } = values;

        // Tự động tạo user_name từ firstName và lastName
        const userName = (firstName + lastName).toLowerCase().replace(/\s/g, '');

        try {
            const res = await registerAPI({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                user_name: userName
            });

            // Backend trả về message "Đăng ký thành công"
            if (res && res.message === "Đăng ký thành công") {
                Toast.show({
                    type: 'success',
                    text1: 'Đăng ký thành công!',
                    text2: 'Bây giờ bạn có thể đăng nhập.'
                });
                router.back();
            } else {
                const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
                Toast.show({
                    type: 'error',
                    text1: 'Đăng ký không thành công',
                    text2: message
                });
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Đã có lỗi xảy ra',
                text2: error?.message ?? 'Vui lòng kiểm tra lại kết nối.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật state tạm khi người dùng cuộn/chọn ngày
    const handleDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
        const currentDate = selectedDate || tempDate;
        if (Platform.OS === 'android') {
            // Trên Android, đóng picker và cập nhật ngay lập tức
            setDatePickerVisible(false);
            if (event.type === 'set') {
                setTempDate(currentDate);
            }
        } else {
            // Trên iOS, chỉ cập nhật state tạm
            setTempDate(currentDate);
        }
    };

    // Xác nhận ngày đã chọn và đóng modal (dành cho iOS)
    const handleDateConfirm = (setFieldValue: (field: string, value: any) => void) => {
        setFieldValue('dob', tempDate);
        setDatePickerVisible(false);
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

                <Formik
                    initialValues={{
                        firstName: '', lastName: '', email: '', password: '',
                        confirmPassword: '', dob: new Date(),
                    }}
                    validationSchema={SignUpSchema}
                    onSubmit={handleSignUp}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                        <>
                            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                    <View style={styles.innerContainer}>
                                        <Text style={styles.title}>Tạo tài khoản của bạn</Text>
                                        <Text style={styles.subtitle}>Điền các thông tin cá nhân của bạn.</Text>

                                        <View style={styles.nameContainer}>
                                            <View style={{ flex: 1 }}>
                                                <ShareInput
                                                    placeholder="Họ"
                                                    onChangeText={handleChange('firstName')}
                                                    onBlur={handleBlur('firstName')}
                                                    value={values.firstName}
                                                    error={errors.firstName}
                                                    touched={touched.firstName}
                                                />
                                            </View>

                                            <View style={{ flex: 1 }}>
                                                <ShareInput
                                                    placeholder="Tên"
                                                    onChangeText={handleChange('lastName')}
                                                    onBlur={handleBlur('lastName')}
                                                    value={values.lastName}
                                                    error={errors.lastName}
                                                    touched={touched.lastName}
                                                />
                                            </View>
                                        </View>

                                        <Pressable
                                            onPress={() => {
                                                setTempDate(values.dob);
                                                setDatePickerVisible(true);
                                            }}>
                                            <View pointerEvents="none">
                                                <ShareInput
                                                    placeholder="Ngày sinh"
                                                    value={values.dob.toLocaleDateString('vi-VN')}
                                                    editable={false}
                                                    error={errors.dob}
                                                    touched={touched.dob}
                                                />
                                            </View>
                                        </Pressable>

                                        {Platform.OS === 'android' && isDatePickerVisible && (
                                            <DateTimePicker
                                                value={values.dob} mode="date" display="default"
                                                onChange={(event, date) => {
                                                    setDatePickerVisible(false);
                                                    if (event.type === 'set' && date) {
                                                        setFieldValue('dob', date);
                                                    }
                                                }}
                                                maximumDate={new Date()}
                                            />
                                        )}

                                        <ShareInput
                                            placeholder="Email"
                                            keyboardType="email-address"
                                            onChangeText={handleChange('email')}
                                            onBlur={handleBlur('email')}
                                            value={values.email}
                                            error={errors.email}
                                            touched={touched.email}
                                        />

                                        <ShareInput
                                            placeholder="Mật khẩu"
                                            secureTextEntry
                                            onChangeText={handleChange('password')}
                                            onBlur={handleBlur('password')}
                                            value={values.password}
                                            error={errors.password}
                                            touched={touched.password}
                                        />

                                        <ShareInput
                                            placeholder="Xác nhận mật khẩu"
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
                                    </View>
                                </TouchableWithoutFeedback>
                            </ScrollView>

                            {/* Modal cho DatePicker trên iOS */}
                            {Platform.OS === 'ios' &&
                                <Modal
                                    transparent={true}
                                    animationType="slide"
                                    visible={isDatePickerVisible}
                                    onRequestClose={() => setDatePickerVisible(false)}
                                >
                                    <Pressable style={styles.modalBackdrop} onPress={() => setDatePickerVisible(false)} />
                                    <View style={styles.modalContainer}>
                                        <View style={styles.modalContent}>
                                            <DateTimePicker
                                                value={tempDate} mode="date" display="spinner"
                                                onChange={handleDateChange}
                                                maximumDate={new Date()}
                                                themeVariant="light" // Fix lỗi màu chữ trên iOS
                                            />
                                            <ShareButton
                                                tittle="Xác nhận"
                                                onPress={() => handleDateConfirm(setFieldValue)}
                                                btnStyle={styles.modalButton}
                                                textStyle={styles.buttonText}
                                            />
                                        </View>
                                    </View>
                                </Modal>
                            }
                        </>
                    )}
                </Formik>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLOR.WHITE
    },
    header: {
        paddingTop: 10,
        paddingHorizontal: 16
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center'
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    innerContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        color: APP_COLOR.BLACK
    },
    subtitle: {
        fontSize: 16,
        color: APP_COLOR.GREY,
        marginBottom: 24
    },
    nameContainer: {
        flexDirection: 'row',
        gap: 16
    },
    button: {
        backgroundColor: APP_COLOR.BLUE_LIGHT,
        borderRadius: 25,
        paddingVertical: 14,
        marginTop: 16
    },
    buttonText: {
        color: APP_COLOR.WHITE,
        fontWeight: 'bold',
        fontSize: 16
    },
    // Styles for DatePicker Modal (iOS)
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    modalContainer: {
        justifyContent: 'flex-end',
        backgroundColor: 'transparent'
    },
    modalContent: {
        backgroundColor: APP_COLOR.WHITE,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        padding: 16
    },
    modalButton: {
        backgroundColor: APP_COLOR.BLUE_LIGHT,
        borderRadius: 15,
        paddingVertical: 12,
        marginTop: 10
    }
});

export default SignUpModal;