import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { ProjectsScreen } from '@/components/screens/ProjectsScreen';
import { LifeMonkColors } from '@/constants/lifemonk-theme';

export default function ProjectsTabScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[LifeMonkColors.screenGradientTop, LifeMonkColors.screenGradientBottom]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <ProjectsScreen onBack={() => router.navigate('/(tabs)')} />
      </View>
    </LinearGradient>
  );
}
