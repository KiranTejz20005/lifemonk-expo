import { Tabs } from 'expo-router';
import React from 'react';

import { LifeMonkTabBar } from '@/components/life-monk-tab-bar';
import { TabBarVisibilityProvider } from '@/contexts/TabBarVisibilityContext';

export default function TabLayout() {
  return (
    <TabBarVisibilityProvider>
      <Tabs
        initialRouteName="index"
        tabBar={(props) => <LifeMonkTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
        <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
        <Tabs.Screen
          name="index"
          options={{
            title: 'BYTES',
          }}
        />
        <Tabs.Screen name="refer" options={{ title: 'Refer' }} />
        <Tabs.Screen name="more" options={{ title: 'More' }} />
        <Tabs.Screen name="bytes" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    </TabBarVisibilityProvider>
  );
}
