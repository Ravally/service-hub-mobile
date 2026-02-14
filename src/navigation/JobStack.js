import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { withErrorBoundary } from '../components/ui/ErrorBoundary';
import TodayJobsScreen from '../screens/jobs/TodayJobsScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import JobFormScreen from '../screens/jobs/JobFormScreen';
import FormResponseViewScreen from '../screens/jobs/FormResponseViewScreen';
import RouteDetailScreen from '../screens/route/RouteDetailScreen';

const SafeTodayJobs = withErrorBoundary(TodayJobsScreen);
const SafeJobDetail = withErrorBoundary(JobDetailScreen);
const SafeJobForm = withErrorBoundary(JobFormScreen);
const SafeFormResponse = withErrorBoundary(FormResponseViewScreen);
const SafeRouteDetail = withErrorBoundary(RouteDetailScreen);

const Stack = createNativeStackNavigator();

export default function JobStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.midnight },
        headerTintColor: colors.trellio,
        headerTitleStyle: { fontFamily: fonts.primary.semiBold, fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="TodayJobs"
        component={SafeTodayJobs}
        options={{ title: "Today's Jobs" }}
      />
      <Stack.Screen
        name="JobDetail"
        component={SafeJobDetail}
        options={{ title: 'Job Details' }}
      />
      <Stack.Screen
        name="JobForm"
        component={SafeJobForm}
        options={{ title: 'Fill Form' }}
      />
      <Stack.Screen
        name="FormResponseView"
        component={SafeFormResponse}
        options={{ title: 'Form Response' }}
      />
      <Stack.Screen
        name="RouteDetail"
        component={SafeRouteDetail}
        options={{ title: 'Route' }}
      />
    </Stack.Navigator>
  );
}
