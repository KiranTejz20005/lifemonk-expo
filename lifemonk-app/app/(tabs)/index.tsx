import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BreathingScreen } from '@/components/screens/BreathingScreen';
import { ChallengesScreen } from '@/components/screens/ChallengesScreen';
import { FocusScreen } from '@/components/screens/FocusScreen';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { JournalScreen } from '@/components/screens/JournalScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { LifeMonkColors } from '@/constants/lifemonk-theme';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';

export type MainScreenState =
  | 'main'
  | 'profile'
  | 'journal'
  | 'challenges'
  | 'breathing'
  | 'focus';

export default function BytesTabScreen() {
  const [screenState, setScreenState] = useState<MainScreenState>('main');
  const [userName, setUserName] = useState('Guest');
  const [homeTab, setHomeTab] = useState('Monk Mode');
  const { setTabBarVisible } = useTabBarVisibility();

  useEffect(() => {
    const visible =
      screenState === 'main' && (homeTab === 'Monk Mode' || homeTab === 'Learn');
    setTabBarVisible(visible);
  }, [screenState, homeTab, setTabBarVisible]);

  return (
    <LinearGradient
      colors={[LifeMonkColors.screenGradientTop, LifeMonkColors.screenGradientBottom]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        {screenState === 'main' && (
          <Animated.View key="main" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
            <HomeScreen
              userName={userName}
              activeTab={homeTab}
              onTabChange={setHomeTab}
              onProfileClick={() => setScreenState('profile')}
              onJournalClick={() => setScreenState('journal')}
              onChallengesClick={() => setScreenState('challenges')}
              onBreathingClick={() => setScreenState('breathing')}
              onFocusClick={() => setScreenState('focus')}
            />
          </Animated.View>
        )}
        {screenState === 'profile' && (
          <Animated.View key="profile" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
            <ProfileScreen onBack={() => setScreenState('main')} />
          </Animated.View>
        )}
        {screenState === 'journal' && (
          <Animated.View key="journal" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
            <JournalScreen onBack={() => setScreenState('main')} />
          </Animated.View>
        )}
        {screenState === 'challenges' && (
          <Animated.View key="challenges" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
            <ChallengesScreen onBack={() => setScreenState('main')} />
          </Animated.View>
        )}
        {screenState === 'breathing' && (
          <Animated.View key="breathing" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
            <BreathingScreen onBack={() => setScreenState('main')} />
          </Animated.View>
        )}
        {screenState === 'focus' && (
          <Animated.View key="focus" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
            <FocusScreen onBack={() => setScreenState('main')} />
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
}
