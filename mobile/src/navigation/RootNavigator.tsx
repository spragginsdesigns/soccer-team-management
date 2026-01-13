import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

import { RootStackParamList } from './types';
import { colors } from '@/constants/theme';
import { LoadingSpinner } from '@/components/ui';

import { AuthStack } from './stacks/AuthStack';
import { TabNavigator } from './TabNavigator';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  console.log('RootNavigator render:', { isLoading, isAuthenticated });

  // Only query user data when authenticated
  const user = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? undefined : 'skip'
  );
  const userProfile = useQuery(
    api.userProfiles.get,
    isAuthenticated ? undefined : 'skip'
  );

  console.log('RootNavigator data:', { user, userProfile });

  // Loading state - waiting for auth to initialize
  if (isLoading) {
    console.log('RootNavigator: showing loading spinner');
    return <LoadingSpinner fullScreen text="Connecting..." />;
  }

  // Not authenticated - show auth screens
  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthStack} />
      </Stack.Navigator>
    );
  }

  // Authenticated but still loading user data
  if (user === undefined || userProfile === undefined) {
    return <LoadingSpinner fullScreen text="Loading user..." />;
  }

  // Authenticated but no profile (needs onboarding)
  if (userProfile === null) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  // Fully authenticated with profile
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
    </Stack.Navigator>
  );
}
