import { useRouter } from 'expo-router';

import { ByteScreen } from '@/components/screens/ByteScreen';

export default function BytesScreen() {
  const router = useRouter();

  return (
    <ByteScreen onBack={() => router.navigate('/(tabs)')} />
  );
}
