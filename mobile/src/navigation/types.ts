import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Root Navigator (Auth + Main App)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Onboarding: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  TeamsTab: NavigatorScreenParams<TeamsStackParamList>;
  MessagesTab: NavigatorScreenParams<MessagesStackParamList>;
  ScheduleTab: NavigatorScreenParams<ScheduleStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Home Stack (Dashboard)
export type HomeStackParamList = {
  Home: undefined;
  PlayerDetails: { playerId: string };
  Assessment: { playerId: string };
  AssessmentDetails: { assessmentId: string };
};

// Teams Stack
export type TeamsStackParamList = {
  TeamsList: undefined;
  TeamDetails: { teamId: string };
  JoinTeam: undefined;
  CreateTeam: undefined;
  TeamSettings: { teamId: string };
};

// Messages Stack
export type MessagesStackParamList = {
  Conversations: undefined;
  Chat: { recipientId?: string; conversationType: 'direct' | 'team' };
};

// Schedule Stack
export type ScheduleStackParamList = {
  Schedule: undefined;
  EventDetails: { eventId: string };
  CreateEvent: undefined;
  EditEvent: { eventId: string };
};

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    MainTabScreenProps<'HomeTab'>
  >;

export type TeamsStackScreenProps<T extends keyof TeamsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<TeamsStackParamList, T>,
    MainTabScreenProps<'TeamsTab'>
  >;

export type MessagesStackScreenProps<T extends keyof MessagesStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MessagesStackParamList, T>,
    MainTabScreenProps<'MessagesTab'>
  >;

export type ScheduleStackScreenProps<T extends keyof ScheduleStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ScheduleStackParamList, T>,
    MainTabScreenProps<'ScheduleTab'>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    MainTabScreenProps<'ProfileTab'>
  >;

// Declare global typing for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
