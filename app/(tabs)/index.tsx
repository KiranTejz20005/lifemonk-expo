import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

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
        )}
        {screenState === 'profile' && (
          <ProfileScreen onBack={() => setScreenState('main')} />
        )}
        {screenState === 'journal' && (
          <JournalScreen onBack={() => setScreenState('main')} />
        )}
        {screenState === 'challenges' && (
          <ChallengesScreen onBack={() => setScreenState('main')} />
        )}
        {screenState === 'breathing' && (
          <BreathingScreen onBack={() => setScreenState('main')} />
        )}
        {screenState === 'focus' && (
          <FocusScreen onBack={() => setScreenState('main')} />
        )}
      </View>
    </LinearGradient>
  );
}
