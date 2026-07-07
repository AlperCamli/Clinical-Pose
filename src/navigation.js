// ============ NATURE — navigation stack ============
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createNavigationContainerRef } from '@react-navigation/native';
import { C } from './theme';

// Imperative handle for navigation from outside the tree (notification taps —
// App.js routes them once the container is ready).
export const navigationRef = createNavigationContainerRef();

import HomeScreen from './screens/HomeScreen';
import ClientSearchScreen from './screens/ClientSearchScreen';
import NewClientScreen from './screens/NewClientScreen';
import ClientProfileScreen from './screens/ClientProfileScreen';
import TreatmentPickerScreen from './screens/TreatmentPickerScreen';
import CaseSetupScreen from './screens/CaseSetupScreen';
import TimelineScreen from './screens/TimelineScreen';
import SessionSetupScreen from './screens/SessionSetupScreen';
import AngleChecklistScreen from './screens/AngleChecklistScreen';
import CameraScreen from './screens/CameraScreen';
import SessionReviewScreen from './screens/SessionReviewScreen';
import CompareScreen from './screens/CompareScreen';
import PostSelectScreen from './screens/PostSelectScreen';
import PostFormatScreen from './screens/PostFormatScreen';
import PostTemplateScreen from './screens/PostTemplateScreen';
import PostPrivacyScreen from './screens/PostPrivacyScreen';
import PostExportScreen from './screens/PostExportScreen';
import PostHistoryScreen from './screens/PostHistoryScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import SyncScreen from './screens/SyncScreen';
import CalendarScreen from './screens/CalendarScreen';
import DayAgendaScreen from './screens/DayAgendaScreen';
import AppointmentSetupScreen from './screens/AppointmentSetupScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import MessageTemplatesScreen from './screens/MessageTemplatesScreen';
import SendResultsScreen from './screens/SendResultsScreen';
import VideoCaptureScreen from './screens/VideoCaptureScreen';
import VideoPlayerScreen from './screens/VideoPlayerScreen';
import PresentationScreen from './screens/PresentationScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="home"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper }, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="home" component={HomeScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="clientSearch" component={ClientSearchScreen} />
      <Stack.Screen name="newClient" component={NewClientScreen} />
      <Stack.Screen name="clientProfile" component={ClientProfileScreen} />
      <Stack.Screen name="treatmentPicker" component={TreatmentPickerScreen} />
      <Stack.Screen name="caseSetup" component={CaseSetupScreen} />
      <Stack.Screen name="timeline" component={TimelineScreen} />
      <Stack.Screen name="sessionSetup" component={SessionSetupScreen} />
      <Stack.Screen name="angleChecklist" component={AngleChecklistScreen} />
      <Stack.Screen
        name="camera"
        component={CameraScreen}
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: '#0c0f14' } }}
      />
      <Stack.Screen name="sessionReview" component={SessionReviewScreen} />
      <Stack.Screen name="compare" component={CompareScreen} />
      <Stack.Screen name="postSelect" component={PostSelectScreen} />
      <Stack.Screen name="postFormat" component={PostFormatScreen} />
      <Stack.Screen name="postTemplate" component={PostTemplateScreen} />
      <Stack.Screen name="postPrivacy" component={PostPrivacyScreen} />
      <Stack.Screen name="postExport" component={PostExportScreen} />
      <Stack.Screen name="postHistory" component={PostHistoryScreen} />
      <Stack.Screen name="postDetail" component={PostDetailScreen} />
      <Stack.Screen name="settings" component={SettingsScreen} />
      <Stack.Screen name="sync" component={SyncScreen} />
      <Stack.Screen name="calendar" component={CalendarScreen} />
      <Stack.Screen name="day" component={DayAgendaScreen} />
      <Stack.Screen name="appointmentSetup" component={AppointmentSetupScreen} />
      <Stack.Screen name="appointmentDetail" component={AppointmentDetailScreen} />
      <Stack.Screen name="messageTemplates" component={MessageTemplatesScreen} />
      <Stack.Screen name="sendResults" component={SendResultsScreen} />
      <Stack.Screen
        name="videoCapture"
        component={VideoCaptureScreen}
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: '#0c0f14' } }}
      />
      <Stack.Screen
        name="videoPlayer"
        component={VideoPlayerScreen}
        options={{ contentStyle: { backgroundColor: '#0c0f14' } }}
      />
      <Stack.Screen
        name="presentation"
        component={PresentationScreen}
        options={{ animation: 'fade', contentStyle: { backgroundColor: '#000' } }}
      />
    </Stack.Navigator>
  );
}
