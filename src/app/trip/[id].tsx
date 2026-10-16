import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { SeatMap } from '@/components/SeatMap';
import { Button, Card, Empty, Icon, Row, Screen } from '@/components/ui';
import { colors, font, space } from '@/constants/theme';
import { getTrip } from '@/lib/catalog';
import { duration, friendlyDate, money } from '@/lib/format';
import { useStore } from '@/lib/store';

export default function TripScreen() {
  const { id, qty: qtyParam } = useLocalSearchParams<{ id: string; qty: string }>();
  const qty = Number(qtyParam ?? 1);
  const trip = getTrip(id);
  const { occupiedSeats } = useStore();
  const [selected, setSelected] = useState<number[]>([]);

  if (!trip) {
    return (
      <Screen>
        <Empty icon="alert-circle-outline" title="Viagem não encontrada" text="Volte e escolha outro horário." />
      </Screen>
    );
  }

  const occupied = occupiedSeats(trip);
  const remaining = qty - selected.length;

  const toggle = (seat: number) => {
    setSelected((s) => {
      if (s.includes(seat)) return s.filter((x) => x !== seat);
      if (s.length === qty) return [...s.slice(1), seat]; // troca o mais antigo
      return [...s, seat].sort((a, b) => a - b);
    });
  };

  return (
    <Screen
      footer={
        <View style={{ gap: space.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={font.small}>
              {selected.length ? `Assento${selected.length > 1 ? 's' : ''} ${selected.join(', ')}` : 'Nenhum assento escolhido'}
            </Text>
            <Text style={[font.h3, { color: colors.brand }]}>{money(trip.price * qty)}</Text>
          </Row>
          <Button
            title={remaining > 0 ? `Escolha mais ${remaining} assento${remaining > 1 ? 's' : ''}` : 'Continuar'}
            disabled={remaining > 0}
            onPress={() =>
              router.push({ pathname: '/checkout/[id]', params: { id: trip.id, seats: selected.join(',') } })
            }
          />
        </View>
      }>
      <Card>
        <Text style={font.h3}>
          {trip.from.name} → {trip.to.name}
        </Text>
        <Text style={[font.small, { marginTop: 4 }]}>
          {friendlyDate(trip.date)} · {trip.departure} às {trip.arrival} · {duration(trip.durationMin)}
        </Text>
        <Row style={{ marginTop: space.md, flexWrap: 'wrap' }} gap={space.sm}>
          <Row gap={4}>
            <Icon name="bus-outline" size={16} color={colors.muted} />
            <Text style={font.small}>{trip.vehicle.label}</Text>
          </Row>
          {trip.vehicle.amenities.map((a) => (
            <Text key={a} style={[font.small, { color: colors.brand }]}>
              · {a}
            </Text>
          ))}
        </Row>
      </Card>

      <Text style={font.small}>
        Toque para escolher {qty > 1 ? `${qty} assentos` : 'seu assento'}. Os da ponta são janela.
      </Text>

      <SeatMap vehicle={trip.vehicle} occupied={occupied} selected={selected} onToggle={toggle} />
    </Screen>
  );
}
