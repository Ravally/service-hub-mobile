import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { withErrorBoundary } from '../components/ui/ErrorBoundary';
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import JobCreateScreen from '../screens/jobs/JobCreateScreen';
import JobFormScreen from '../screens/jobs/JobFormScreen';
import FormResponseViewScreen from '../screens/jobs/FormResponseViewScreen';
import PhotoMarkupScreen from '../screens/common/PhotoMarkupScreen';
import RouteDetailScreen from '../screens/route/RouteDetailScreen';
import ClientDetailScreen from '../screens/clients/ClientDetailScreen';

const SafeSchedule = withErrorBoundary(ScheduleScreen);
const SafeJobDetail = withErrorBoundary(JobDetailScreen);
const SafeJobCreate = withErrorBoundary(JobCreateScreen);
const SafeJobForm = withErrorBoundary(JobFormScreen);
const SafeFormResponse = withErrorBoundary(FormResponseViewScreen);
const SafePhotoMarkup = withErrorBoundary(PhotoMarkupScreen);
const SafeRouteDetail = withErrorBoundary(RouteDetailScreen);
const SafeClientDetail = withErrorBoundary(ClientDetailScreen);

const Stack = createNativeStackNavigator();

export default function ScheduleStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.midnight },
        headerTintColor: colors.scaffld,
        headerTitleStyle: { fontFamily: fonts.primary.semiBold, fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="ScheduleScreen" component={SafeSchedule} options={{ title: 'Schedule' }} />
      <Stack.Screen name="JobDetail" component={SafeJobDetail} options={{ title: 'Job Details' }} />
      <Stack.Screen name="JobCreate" component={SafeJobCreate} options={{ title: 'New Job' }} />
      <Stack.Screen name="JobForm" component={SafeJobForm} options={{ title: 'Fill Form' }} />
      <Stack.Screen name="FormResponseView" component={SafeFormResponse} options={{ title: 'Form Response' }} />
      <Stack.Screen name="PhotoMarkup" component={SafePhotoMarkup} options={{ headerShown: false }} />
      <Stack.Screen name="RouteDetail" component={SafeRouteDetail} options={{ title: 'Route' }} />
      <Stack.Screen name="ClientDetail" component={SafeClientDetail} options={{ title: 'Client Details' }} />
    </Stack.Navigator>
  );
}
