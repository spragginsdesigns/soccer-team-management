import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { colors, fontSize, fontWeight } from '@/constants/theme';

// Screens
import { HomeScreen } from '@/screens/home/HomeScreen';
import { PlayerDetailsScreen } from '@/screens/players/PlayerDetailsScreen';
import { AssessmentScreen } from '@/screens/assessments/AssessmentScreen';
import { AssessmentDetailsScreen } from '@/screens/assessments/AssessmentDetailsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontSize: fontSize.lg,
          fontWeight: fontWeight.semibold,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlayerDetails"
        component={PlayerDetailsScreen}
        options={{ title: 'Player Details' }}
      />
      <Stack.Screen
        name="Assessment"
        component={AssessmentScreen}
        options={{ title: 'New Assessment' }}
      />
      <Stack.Screen
        name="AssessmentDetails"
        component={AssessmentDetailsScreen}
        options={{ title: 'Assessment' }}
      />
    </Stack.Navigator>
  );
}
