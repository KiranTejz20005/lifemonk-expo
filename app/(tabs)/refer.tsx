import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { ReferScreen } from '@/components/screens/ReferScreen';
import { LifeMonkColors } from '@/constants/lifemonk-theme';

export default function ReferTabScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[LifeMonkColors.screenGradientTop, LifeMonkColors.screenGradientBottom]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <ReferScreen userName="Guest" onBack={() => router.navigate('/(tabs)')} />
      </View>
    </LinearGradient>
  );
}
