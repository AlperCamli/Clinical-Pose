// ============ NATURE — Clinical Posing (Expo entry) ============
import React from 'react';
import { View, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
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

import { AppProvider, useApp } from './src/store';
import { Toast } from './src/components/ui';
import RootNavigator, { navigationRef } from './src/navigation';
import { C } from './src/theme';
import { configureNotifications, addResponseListener, getInitialResponse } from './src/data/notifications';
import { todayISO } from './src/data/clock';

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.paper } };

// Global notification handler + Android channel, set up once at import time so
// notifications received while the app is foregrounded still banner.
configureNotifications();

// The app is a phone-first portrait design; tablets stay rotatable for the
// two-pane calendar and TV presentation mode (app.json orientation: default).
const IS_TABLET = Math.min(Dimensions.get('window').width, Dimensions.get('window').height) >= 768;
if (!IS_TABLET) ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});

// data.type → route (see src/data/notifications.js for the payload contract)
function routeNotification(data) {
  if (!data?.type || !navigationRef.isReady()) return;
  if (data.type === 'appt') navigationRef.navigate('appointmentDetail', { aptId: data.aptId });
  else if (data.type === 'send-reminder') navigationRef.navigate('appointmentDetail', { aptId: data.aptId, openSend: true, openSendAt: Date.now() });
  else if (data.type === 'day') navigationRef.navigate('day', { date: todayISO() });
  else if (data.type === 'post') navigationRef.navigate('postDetail', { cid: data.cid, caseId: data.caseId, postId: data.postId });
}

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

  // Notification taps: live listener + the response that may have cold-started
  // the app. Routed in onReady/effect — the container only mounts after the
  // store hydrates (AppProvider gates children), so lookups always resolve.
  React.useEffect(() => {
    const sub = addResponseListener(routeNotification);
    return () => sub.remove();
  }, []);

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer
          theme={navTheme}
          ref={navigationRef}
          onReady={() => { getInitialResponse().then(routeNotification).catch(() => {}); }}
        >
          <View style={{ flex: 1 }}>
            <RootNavigator />
            <ToastHost />
          </View>
        </NavigationContainer>
        <StatusBar style="dark" />
      </AppProvider>
    </SafeAreaProvider>
  );
}
