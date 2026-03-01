import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { MoreScreen } from '@/components/screens/MoreScreen';
import { LifeMonkColors } from '@/constants/lifemonk-theme';

export default function MoreTabScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[LifeMonkColors.screenGradientTop, LifeMonkColors.screenGradientBottom]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <MoreScreen onBack={() => router.navigate('/(tabs)')} onLogout={() => router.navigate('/(tabs)')} />
      </View>
    </LinearGradient>
  );
}
