import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Icon, Row, Screen, type IconName } from '@/components/ui';
import { colors, font, space } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function Profile() {
  const { user, myTickets, logout } = useStore();
  if (!user) return null;

  const trips = myTickets.filter((t) => t.status === 'confirmed' || t.status === 'boarded').length;
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Screen edges={[]}>
      <Card>
        <Row gap={space.lg}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={font.h2}>{user.name}</Text>
            <Text style={font.small}>{user.email}</Text>
            <Text style={font.small}>{user.phone}</Text>
          </View>
        </Row>
        <Row style={styles.stats}>
          <Stat value={String(trips)} label={trips === 1 ? 'viagem' : 'viagens'} />
          <View style={styles.vline} />
          <Stat value={new Date(user.createdAt).getFullYear().toString()} label="cliente desde" />
        </Row>
      </Card>

      <Card style={{ padding: 0 }}>
        <Item icon="ticket-outline" label="Minhas passagens" onPress={() => router.navigate('/tickets')} />
        <Item
          icon="speedometer-outline"
          label="Painel da operação"
          hint="Vendas do dia e embarque (motorista/empresa)"
          onPress={() => router.push('/operation')}
        />
        <Item icon="help-circle-outline" label="Regras de cancelamento" hint="Reembolso até 3 h antes da partida" last />
      </Card>

      <Button
        title="Sair da conta"
        variant="danger"
        icon="log-out-outline"
        onPress={async () => {
          await logout();
          router.replace('/welcome');
        }}
      />

      <Text style={[font.small, { textAlign: 'center' }]}>Travan · versão 2.0</Text>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={font.h2}>{value}</Text>
      <Text style={font.small}>{label}</Text>
    </View>
  );
}

function Item({ icon, label, hint, onPress, last }: { icon: IconName; label: string; hint?: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      style={({ pressed }) => [styles.item, !last && styles.itemBorder, pressed && { backgroundColor: colors.bg }]}>
      <View style={styles.itemIcon}>
        <Icon name={icon} size={20} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={font.body}>{label}</Text>
        {hint && <Text style={font.small}>{hint}</Text>}
      </View>
      {onPress && <Icon name="chevron-forward" size={18} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontSize: 22, fontWeight: '800' },
  stats: { marginTop: space.lg, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: colors.border },
  vline: { width: 1, height: 32, backgroundColor: colors.border },
  item: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
