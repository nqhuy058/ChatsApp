import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

const styles = StyleSheet.create({
    btnContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    text: {
        fontSize: 16,
        fontWeight: "600",
    }
})

interface IProps {
    tittle: string;
    onPress: () => void;
    textStyle?: StyleProp<TextStyle>;
    pressStyle?: StyleProp<ViewStyle>;
    btnStyle?: StyleProp<ViewStyle>;
    icons?: ReactNode;
    loading?: boolean;

}

const ShareButton = (props: IProps) => {
    const { tittle, onPress, textStyle,
        pressStyle, btnStyle,
        icons, loading = false, 
    } = props;
    
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
                pressStyle
            ]}
        >
            <View style={[styles.btnContainer, btnStyle]}>
                {loading && <ActivityIndicator color={"black"} />}
                {icons}
                <Text style={[styles.text, textStyle]}>
                    {tittle}
                </Text>
            </View>
        </Pressable>
    )
}

export default ShareButton;