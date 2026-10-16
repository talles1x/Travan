import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { StoreProvider } from '@/lib/store';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.brandDark },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: '700' },
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.bg },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Entrar' }} />
          <Stack.Screen name="register" options={{ title: 'Criar conta' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="results" options={{ title: 'Viagens' }} />
          <Stack.Screen name="trip/[id]" options={{ title: 'Escolha o assento' }} />
          <Stack.Screen name="checkout/[id]" options={{ title: 'Passageiros' }} />
          <Stack.Screen name="pix/[ticketId]" options={{ title: 'Pagamento', gestureEnabled: false }} />
          <Stack.Screen name="ticket/[id]" options={{ title: 'Sua passagem' }} />
          <Stack.Screen name="operation" options={{ title: 'Painel da operação' }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
