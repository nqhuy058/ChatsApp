import { APP_COLOR } from '@/utils/constant';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useState } from "react";
import { KeyboardTypeOptions, Platform, StyleSheet, Text, TextInput, View } from "react-native";

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: APP_COLOR.GREY,
        marginBottom: 8,
    },
    inputContainer: {
        position: "relative",
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 15,
        backgroundColor: APP_COLOR.WHITE,
        fontSize: 16,
        color: APP_COLOR.BLACK,
    },
    inputFocused: {
        borderColor: APP_COLOR.BLACK,
        backgroundColor: APP_COLOR.WHITE,
    },
    eye: {
        position: 'absolute',
        right: 15,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    }
})

interface IProps {
    title?: string;
    keyboardType?: KeyboardTypeOptions;
    secureTextEntry?: boolean;
    value: any;
    setValue?: (v: any) => void;
    onChangeText?: any;
    onBlur?: any;
    error?: any;
    touched?: any;
    editable?: any;
    placeholder?: string;
    multiline?: boolean;
    numberOfLines?: number;
}

const ShareInput = (props: IProps) => {
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [isShowPassword, setIsShowPassword] = useState<boolean>(false);
    const { title, keyboardType, secureTextEntry = false,
        value, setValue, onChangeText, onBlur,
        error, touched, editable = true, placeholder = "",
        multiline = false, numberOfLines
    } = props;

    return (
        <View style={styles.inputGroup}>
            {title && <Text style={styles.label}>
                {title}
            </Text>}
            <View style={styles.inputContainer}>
                <TextInput
                    editable={editable}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={(e) => {
                        if (onBlur)
                            onBlur(e);
                        setIsFocused(false);
                    }}
                    keyboardType={keyboardType}
                    placeholder={placeholder}
                    placeholderTextColor="#65676B"
                    style={[
                        styles.input,
                        isFocused && styles.inputFocused,
                        multiline && { height: 100, textAlignVertical: 'top' }
                    ]}
                    secureTextEntry={secureTextEntry && !isShowPassword}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                />
                {secureTextEntry &&
                    <FontAwesome5
                        style={styles.eye}
                        name={isShowPassword ? "eye" : "eye-slash"}
                        size={18}
                        color={"#65676B"}
                        onPress={() => setIsShowPassword(!isShowPassword)}
                    />
                }
            </View>
            {error && touched && <Text style={styles.errorText}>{error}</Text>}
        </View>
    )
}

export default ShareInput;