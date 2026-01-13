import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeamsStackParamList } from '../types';
import { colors, fontSize, fontWeight } from '@/constants/theme';

// Screens
import { TeamsListScreen } from '@/screens/teams/TeamsListScreen';
import { TeamDetailsScreen } from '@/screens/teams/TeamDetailsScreen';
import { JoinTeamScreen } from '@/screens/teams/JoinTeamScreen';
import { CreateTeamScreen } from '@/screens/teams/CreateTeamScreen';
import { TeamSettingsScreen } from '@/screens/teams/TeamSettingsScreen';

const Stack = createNativeStackNavigator<TeamsStackParamList>();

export function TeamsStack() {
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
        name="TeamsList"
        component={TeamsListScreen}
        options={{ title: 'My Teams' }}
      />
      <Stack.Screen
        name="TeamDetails"
        component={TeamDetailsScreen}
        options={{ title: 'Team' }}
      />
      <Stack.Screen
        name="JoinTeam"
        component={JoinTeamScreen}
        options={{ title: 'Join Team' }}
      />
      <Stack.Screen
        name="CreateTeam"
        component={CreateTeamScreen}
        options={{ title: 'Create Team' }}
      />
      <Stack.Screen
        name="TeamSettings"
        component={TeamSettingsScreen}
        options={{ title: 'Team Settings' }}
      />
    </Stack.Navigator>
  );
}
