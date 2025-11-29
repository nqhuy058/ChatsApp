
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootSiblingParent } from "react-native-root-siblings";
import Toast from 'react-native-toast-message';


const RootLayout = () => {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'white',
    },
  }

  return (
    <GestureHandlerRootView>
      <RootSiblingParent>
        {/* <SafeAreaView style={{ flex: 1 }}> */}
        <ThemeProvider value={navTheme}>
          <Stack
          // screenOptions={
          //   {
          //     headerTintColor: APP_COLOR.ORANGE,
          //     headerTitleStyle: {
          //       color: "black"
          //     },
          //   }
          // }
          >
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
                // animation: "fade",
                presentation: "transparentModal",
              }}
            />

            <Stack.Screen
              name="(auth)/request.password.modal"
              options={{
                headerShown: false,
                // animation: "fade",
                presentation: "transparentModal",
              }}
            />

            <Stack.Screen
              name="(auth)/forgot.password.modal"
              options={{
                headerShown: false,
                // animation: "fade",
                presentation: "transparentModal",
              }}
            />

            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />

          </Stack>
        </ThemeProvider>
        {/* </SafeAreaView> */}

      </RootSiblingParent>
    </GestureHandlerRootView>
  )
}

export default RootLayout

//