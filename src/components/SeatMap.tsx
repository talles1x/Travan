import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space } from '@/constants/theme';
import type { Vehicle } from '@/lib/types';

import { Icon, Row } from './ui';

type Props = {
  vehicle: Vehicle;
  occupied: number[];
  selected: number[];
  onToggle: (seat: number) => void;
};

/**
 * Mapa de assentos visto de cima: motorista à frente, corredor no meio.
 * Assentos de janela ficam nas pontas de cada fileira.
 */
export function SeatMap({ vehicle, occupied, selected, onToggle }: Props) {
  const [left, right] = vehicle.layout;
  const perRow = left + right;
  const rows = Math.ceil(vehicle.seats / perRow);

  const press = (seat: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onToggle(seat);
  };

  return (
    <View style={styles.bus}>
      <Row style={styles.front}>
        <View style={styles.wheel}>
          <Icon name="radio-button-on-outline" size={22} color={colors.muted} />
        </View>
        <Text style={styles.frontText}>Frente</Text>
      </Row>

      {Array.from({ length: rows }, (_, r) => (
        <Row key={r} gap={space.sm} style={{ justifyContent: 'center' }}>
          {Array.from({ length: perRow }, (_, c) => {
            const seat = r * perRow + c + 1;
            const isAisle = c === left;
            const window = c === 0 || c === perRow - 1;
            const node =
              seat > vehicle.seats ? (
                <View key={c} style={styles.seatGhost} />
              ) : (
                <Seat
                  key={c}
                  number={seat}
                  window={window}
                  state={occupied.includes(seat) ? 'taken' : selected.includes(seat) ? 'selected' : 'free'}
                  onPress={() => press(seat)}
                />
              );
            return isAisle ? (
              <Row key={`a${c}`} gap={space.sm}>
                <View style={styles.aisle} />
                {node}
              </Row>
            ) : (
              node
            );
          })}
        </Row>
      ))}

      <Row style={styles.legend} gap={space.lg}>
        <Legend color={colors.card} border={colors.border} label="Livre" />
        <Legend color={colors.brand} label="Escolhido" />
        <Legend color="#E4E2EA" label="Ocupado" />
      </Row>
    </View>
  );
}

function Seat({
  number,
  state,
  window,
  onPress,
}: {
  number: number;
  state: 'free' | 'taken' | 'selected';
  window: boolean;
  onPress: () => void;
}) {
  const taken = state === 'taken';
  const selected = state === 'selected';
  return (
    <Pressable
      onPress={onPress}
      disabled={taken}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: taken }}
      accessibilityLabel={`Assento ${number}${window ? ', janela' : ', corredor'}${taken ? ', ocupado' : ''}`}
      style={({ pressed }) => [
        styles.seat,
        selected && styles.seatSelected,
        taken && styles.seatTaken,
        pressed && { transform: [{ scale: 0.94 }] },
      ]}>
      {taken ? (
        <Icon name="close" size={16} color="#A19FB0" />
      ) : (
        <Text style={[styles.seatText, selected && { color: colors.white }]}>{number}</Text>
      )}
    </Pressable>
  );
}

function Legend({ color, border, label }: { color: string; border?: string; label: string }) {
  return (
    <Row gap={6}>
      <View style={[styles.legendBox, { backgroundColor: color, borderColor: border ?? color }]} />
      <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
    </Row>
  );
}

const SEAT = 48;

const styles = StyleSheet.create({
  bus: {
    alignSelf: 'center',
    backgroundColor: '#FBFAFD',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  front: { justifyContent: 'space-between', marginBottom: space.sm, paddingHorizontal: 4 },
  wheel: { width: SEAT, alignItems: 'center' },
  frontText: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  seat: {
    width: SEAT,
    height: SEAT,
    borderRadius: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  seatTaken: { backgroundColor: '#E4E2EA', borderColor: '#E4E2EA' },
  seatGhost: { width: SEAT, height: SEAT },
  seatText: { fontSize: 15, fontWeight: '700', color: colors.text },
  aisle: { width: 20 },
  legend: { justifyContent: 'center', marginTop: space.md },
  legendBox: { width: 16, height: 16, borderRadius: 5, borderWidth: 1.5 },
});
