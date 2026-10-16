import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function Index() {
  const { ready, user } = useStore();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandDark }}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }

  return <Redirect href={user ? '/home' : '/welcome'} />;
}
