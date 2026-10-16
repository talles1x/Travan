import { StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@/constants/theme';
import { duration, money } from '@/lib/format';
import type { Trip } from '@/lib/types';

import { Card, Icon, Row } from './ui';

export function TripCard({ trip, available, onPress }: { trip: Trip; available: number; onPress?: () => void }) {
  const soldOut = available === 0;
  const few = available > 0 && available <= 3;

  return (
    <Card
      onPress={soldOut ? undefined : onPress}
      style={soldOut ? { opacity: 0.55 } : undefined}>
      <View
        accessible
        accessibilityLabel={`Saída ${trip.departure}, chegada ${trip.arrival}, ${trip.vehicle.label}, ${money(trip.price)}, ${
          soldOut ? 'esgotado' : `${available} assentos livres`
        }`}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.time}>{trip.departure}</Text>
            <Text style={font.small}>{trip.from.name}</Text>
          </View>
          <View style={styles.middle}>
            <Text style={styles.duration}>{duration(trip.durationMin)}</Text>
            <View style={styles.line}>
              <View style={styles.dot} />
              <View style={styles.dash} />
              <Icon name="bus" size={14} color={colors.brand} />
              <View style={styles.dash} />
              <View style={[styles.dot, { backgroundColor: colors.brand }]} />
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.time}>{trip.arrival}</Text>
            <Text style={font.small}>{trip.to.name}</Text>
          </View>
        </Row>

        <View style={styles.divider} />

        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Text style={font.h3}>{trip.vehicle.label}</Text>
            <Text style={[font.small, few && { color: colors.warning, fontWeight: '600' }, soldOut && { color: colors.danger }]}>
              {soldOut ? 'Esgotado' : few ? `Só ${available} ${available === 1 ? 'assento' : 'assentos'}!` : `${available} assentos livres`}
            </Text>
          </View>
          <Text style={styles.price}>{money(trip.price)}</Text>
        </Row>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  time: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  middle: { flex: 1, alignItems: 'center', paddingHorizontal: space.md },
  duration: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'stretch' },
  dash: { flex: 1, height: 1.5, backgroundColor: colors.border },
  dot: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: colors.brand },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.md },
  price: { fontSize: 20, fontWeight: '800', color: colors.brand },
});
