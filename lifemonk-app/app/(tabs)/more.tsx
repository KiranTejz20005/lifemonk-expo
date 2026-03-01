import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { MoreScreen } from '@/components/screens/MoreScreen';
import { LifeMonkColors } from '@/constants/lifemonk-theme';
import { logout } from '@/src/services/auth';

export default function MoreTabScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    // onAuthChange listener in _layout.tsx will set authed=false and show login
  };

  return (
    <LinearGradient
      colors={[LifeMonkColors.screenGradientTop, LifeMonkColors.screenGradientBottom]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <MoreScreen onBack={() => router.navigate('/(tabs)')} onLogout={handleLogout} />
      </View>
    </LinearGradient>
  );
}
