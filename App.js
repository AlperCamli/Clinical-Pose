// ============ NATURE — Clinical Posing (Expo entry) ============
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
} from '@expo-google-fonts/geist-mono';

import { FaceDetectionProvider } from './src/data/faceDetection';
import { AppProvider, useApp } from './src/store';
import { Toast } from './src/components/ui';
import RootNavigator from './src/navigation';
import { C } from './src/theme';

// on-device ML Kit face detection — landmarks on (eyes), fast mode for stills
const FACE_OPTS = { performanceMode: 'fast', landmarkMode: true };

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.paper } };

function ToastHost() {
  const { toastMsg } = useApp();
  return <Toast msg={toastMsg} />;
}

export default function App() {
  const [loaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
  });

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  }

  return (
    <SafeAreaProvider>
      <FaceDetectionProvider options={FACE_OPTS}>
        <AppProvider>
          <NavigationContainer theme={navTheme}>
            <View style={{ flex: 1 }}>
              <RootNavigator />
              <ToastHost />
            </View>
          </NavigationContainer>
          <StatusBar style="dark" />
        </AppProvider>
      </FaceDetectionProvider>
    </SafeAreaProvider>
  );
}
