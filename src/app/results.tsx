import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { TripCard } from '@/components/TripCard';
import { Button, Chip, Empty, Screen } from '@/components/ui';
import { colors, font, space } from '@/constants/theme';
import { cityById, findTrips, nextDays } from '@/lib/catalog';
import { dayChip, departureTime, friendlyDate } from '@/lib/format';
import { useStore } from '@/lib/store';
import { useNow } from '@/hooks/use-now';

type Period = 'todos' | 'manha' | 'tarde';

export default function Results() {
  const params = useLocalSearchParams<{ from: string; to: string; date: string; qty: string }>();
  const { occupiedSeats } = useStore();
  const now = useNow();
  const [date, setDate] = useState(params.date);
  const [period, setPeriod] = useState<Period>('todos');
  const qty = Number(params.qty ?? 1);
  const days = useMemo(() => nextDays(14), []);

  const trips = useMemo(() => {
    const salesClose = now + 15 * 60 * 1000; // vendas fecham 15 min antes
    return findTrips(params.from, params.to, date)
      .filter((t) => departureTime(t.date, t.departure) > salesClose)
      .filter((t) => {
        const hour = Number(t.departure.slice(0, 2));
        return period === 'todos' || (period === 'manha' ? hour < 12 : hour >= 12);
      })
      .map((t) => ({ trip: t, available: t.vehicle.seats - occupiedSeats(t).length }));
  }, [params.from, params.to, date, period, occupiedSeats, now]);

  const title = `${cityById(params.from).name} → ${cityById(params.to).name}`;

  return (
    <>
      <Stack.Screen options={{ title }} />
      <Screen>
        <View style={{ gap: space.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {days.map((d, i) => {
              const c = dayChip(d);
              return (
                <Chip
                  key={d}
                  selected={d === date}
                  onPress={() => setDate(d)}
                  sublabel={i === 0 ? 'hoje' : i === 1 ? 'amanhã' : c.week}
                  label={`${c.day} ${c.month}`}
                />
              );
            })}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Chip label="Todos" selected={period === 'todos'} onPress={() => setPeriod('todos')} />
            <Chip label="Manhã" selected={period === 'manha'} onPress={() => setPeriod('manha')} />
            <Chip label="Tarde e noite" selected={period === 'tarde'} onPress={() => setPeriod('tarde')} />
          </View>
        </View>

        <Text style={font.small} accessibilityLiveRegion="polite">
          {trips.length} {trips.length === 1 ? 'horário' : 'horários'} em {friendlyDate(date).toLowerCase()} ·{' '}
          {qty} {qty > 1 ? 'passageiros' : 'passageiro'}
        </Text>

        {trips.length === 0 ? (
          <Empty
            icon="calendar-outline"
            title="Sem horários disponíveis"
            text="Os horários deste dia já saíram ou não batem com o filtro. Tente outro dia."
            action={<Button title="Ver amanhã" variant="secondary" onPress={() => setDate(days[1])} />}
          />
        ) : (
          trips.map(({ trip, available }) => (
            <TripCard
              key={trip.id}
              trip={trip}
              available={available}
              onPress={() => {
                if (available < qty) return;
                router.push({ pathname: '/trip/[id]', params: { id: trip.id, qty: String(qty) } });
              }}
            />
          ))
        )}

        {trips.some((t) => t.available > 0 && t.available < qty) && (
          <Text style={[font.small, { color: colors.warning }]}>
            Alguns horários não têm {qty} assentos livres juntos.
          </Text>
        )}
      </Screen>
    </>
  );
}
