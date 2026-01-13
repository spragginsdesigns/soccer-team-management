import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

import { MainTabParamList } from './types';
import { colors, fontSize } from '@/constants/theme';

// Stack Navigators
import { HomeStack } from './stacks/HomeStack';
import { TeamsStack } from './stacks/TeamsStack';
import { MessagesStack } from './stacks/MessagesStack';
import { ScheduleStack } from './stacks/ScheduleStack';
import { ProfileStack } from './stacks/ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

const getTabIcon = (routeName: string, focused: boolean): IconName => {
  const icons: Record<string, { focused: IconName; unfocused: IconName }> = {
    HomeTab: { focused: 'home', unfocused: 'home-outline' },
    TeamsTab: { focused: 'people', unfocused: 'people-outline' },
    MessagesTab: { focused: 'chatbubbles', unfocused: 'chatbubbles-outline' },
    ScheduleTab: { focused: 'calendar', unfocused: 'calendar-outline' },
    ProfileTab: { focused: 'person', unfocused: 'person-outline' },
  };

  return focused
    ? icons[routeName]?.focused ?? 'ellipse'
    : icons[routeName]?.unfocused ?? 'ellipse-outline';
};

export function TabNavigator() {
  // Get unread message count for badge
  const unreadCount = useQuery(api.messages.getUnreadCount) ?? 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.muted.foreground,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={getTabIcon(route.name, focused)}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="TeamsTab"
        component={TeamsStack}
        options={{ tabBarLabel: 'Teams' }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStack}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary.DEFAULT,
            color: colors.primary.foreground,
            fontSize: 10,
            minWidth: 18,
            height: 18,
          },
        }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleStack}
        options={{ tabBarLabel: 'Schedule' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
