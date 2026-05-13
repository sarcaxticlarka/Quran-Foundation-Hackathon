import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { MiniPlayer } from '../../src/components/MiniPlayer';
import { NotificationBar } from '../../src/components/NotificationBar';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { useNotificationStore } from '../../src/stores/notificationStore';
import { useStreakStore } from '../../src/stores/streakStore';
import { useReviewStore } from '../../src/stores/reviewStore';
import { groqAI } from '../../src/services/groqAI';
import { getSlotForHour } from '../../src/utils/nudgeScheduler';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  icon: IoniconName;
  iconFocused: IoniconName;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, iconFocused, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={focused ? iconFocused : icon}
        size={22}
        color={focused ? Colors.gold : Colors.tabInactive}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      {focused && <View style={styles.tabDot} />}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tabBarHeight = 60 + insets.bottom;

  useEffect(() => {
    (async () => {
      try {
        const streak = useStreakStore.getState().currentStreak;
        const dueCount = useReviewStore.getState().getDueCount();
        const timeSlot = getSlotForHour(new Date().getHours());

        let type: 'streak' | 'review' | 'general';
        let context: { streakDays?: number; dueCards?: number; timeSlot?: string };

        if (streak === 0) {
          type = 'streak';
          context = { streakDays: streak };
        } else if (dueCount > 0) {
          type = 'review';
          context = { dueCards: dueCount };
        } else {
          type = 'general';
          context = { timeSlot };
        }

        const result = await groqAI.getNotificationMessage(type, context);
        useNotificationStore.getState().enqueue({
          id: Date.now().toString(),
          ...result,
          type,
        });
      } catch {}
    })();
  }, []);

  return (
    <ErrorBoundary onGoHome={() => router.replace('/(tabs)')}>

    <View style={{ flex: 1 }}>
      <NotificationBar />
      <OfflineBanner />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#0A1E10',
          borderTopColor: 'rgba(201,164,86,0.15)',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: insets.bottom + 6,
          elevation: 0,
          shadowColor: Colors.gold,
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home-outline" iconFocused="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Growth',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="bar-chart-outline" iconFocused="bar-chart" label="Growth" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Halaqa',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="people-outline" iconFocused="people" label="Halaqa" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="compass-outline" iconFocused="compass" label="Explore" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person-outline" iconFocused="person" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
    {/* MiniPlayer sits above the tab bar, persists across all tabs */}
    <View style={{ position: 'absolute', bottom: tabBarHeight, left: 0, right: 0, zIndex: 100 }}>
      <MiniPlayer />
    </View>
    </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 52,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: 'Raleway_600SemiBold',
    color: Colors.tabInactive,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: Colors.gold },
  tabDot: {
    width: 3, height: 3, borderRadius: 2,
    backgroundColor: Colors.gold, marginTop: 1,
  },
});
