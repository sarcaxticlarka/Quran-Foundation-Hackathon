import { Stack } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index"      options={{ animation: 'fade',             contentStyle: { backgroundColor: '#0B2214' } }} />
      <Stack.Screen name="login"      options={{ contentStyle: { backgroundColor: '#0B2214' } }} />
      <Stack.Screen name="signup"     options={{ contentStyle: { backgroundColor: '#0B2214' } }} />
      <Stack.Screen name="onboarding" options={{ contentStyle: { backgroundColor: '#0B2214' } }} />
    </Stack>
  );
}
