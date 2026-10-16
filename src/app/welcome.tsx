import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Row } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';

const perks = [
  { icon: 'grid-outline' as const, text: 'Escolha o assento no mapa' },
  { icon: 'flash-outline' as const, text: 'Pague com Pix na hora' },
  { icon: 'qr-code-outline' as const, text: 'Embarque só com o QR code' },
];

export default function Welcome() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Icon name="bus" size={34} color={colors.white} />
        </View>
        <Text style={styles.brand}>Travan</Text>
        <Text style={styles.title}>Sua passagem de van e ônibus pelo celular.</Text>
        <Text style={styles.subtitle}>Sem fila no guichê e sem papel.</Text>

        <View style={{ gap: space.md, marginTop: space.xl }}>
          {perks.map((p) => (
            <Row key={p.text} gap={space.md}>
              <View style={styles.perkIcon}>
                <Icon name={p.icon} size={18} color={colors.accent} />
              </View>
              <Text style={styles.perk}>{p.text}</Text>
            </Row>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Criar conta grátis" onPress={() => router.push('/register')} />
        <Button
          title="Já tenho conta"
          variant="onDark"
          onPress={() => router.push('/login')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brandDark, padding: space.xl, justifyContent: 'space-between' },
  hero: { marginTop: space.xxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: colors.accent, fontSize: 16, fontWeight: '800', marginTop: space.xl, letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.white, fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginTop: space.sm, lineHeight: 38 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 17, marginTop: space.md },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20,184,166,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perk: { color: colors.white, fontSize: 16 },
  actions: { gap: space.sm },
});
