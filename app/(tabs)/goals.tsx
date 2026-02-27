import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { GoalsScreen } from '@/components/screens/GoalsScreen';
import { LifeMonkColors } from '@/constants/lifemonk-theme';

export default function GoalsTabScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[LifeMonkColors.screenGradientTop, LifeMonkColors.screenGradientBottom]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <GoalsScreen onBack={() => router.navigate('/(tabs)')} />
      </View>
    </LinearGradient>
  );
}
