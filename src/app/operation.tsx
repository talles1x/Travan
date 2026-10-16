import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, Empty, Field, Icon, Row, Screen, SectionTitle, StatusBadge } from '@/components/ui';
import { colors, font, radius, space } from '@/constants/theme';
import { findTrips, nextDays, routes } from '@/lib/catalog';
import { friendlyDate, money } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Ticket, Trip } from '@/lib/types';

export default function Operation() {
  const { tickets, occupiedSeats, board } = useStore();
  const days = useMemo(() => nextDays(3), []);
  const [date, setDate] = useState(days[0]);
  const [openTrip, setOpenTrip] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  /* ---------- Resumo do dia ---------- */
  const summary = useMemo(() => {
    const trips = routes.flatMap((r) => findTrips(r.from, r.to, date));
    let sold = 0;
    let capacity = 0;
    let revenue = 0;
    for (const t of trips) {
      const occ = occupiedSeats(t).length;
      sold += occ;
      capacity += t.vehicle.seats;
      revenue += occ * t.price;
    }
    return { trips: trips.length, sold, revenue, occupancy: capacity ? Math.round((sold / capacity) * 100) : 0 };
  }, [date, occupiedSeats]);

  /* ---------- Viagens com passagens vendidas pelo app ---------- */
  const appTrips = useMemo(() => {
    const map = new Map<string, { trip: Trip; tickets: Ticket[] }>();
    for (const t of tickets) {
      if (!['confirmed', 'boarded'].includes(t.status)) continue;
      const trip = routes.flatMap((r) => findTrips(r.from, r.to, date)).find((x) => x.id === t.tripId);
      if (!trip) continue;
      const entry = map.get(trip.id) ?? { trip, tickets: [] };
      entry.tickets.push(t);
      map.set(trip.id, entry);
    }
    return [...map.values()].sort((a, b) => a.trip.departure.localeCompare(b.trip.departure));
  }, [tickets, date]);

  const validate = async (tripId: string) => {
    const res = await board(code, tripId);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(res.ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    }
    setFeedback(
      res.ok
        ? { ok: true, text: `Embarque liberado: ${res.ticket!.passengers.map((p) => `${p.name.split(' ')[0]} (${p.seat})`).join(', ')}` }
        : { ok: false, text: res.error },
    );
    if (res.ok) setCode('');
  };

  return (
    <Screen>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {days.map((d) => (
          <Chip key={d} label={friendlyDate(d)} selected={d === date} onPress={() => setDate(d)} />
        ))}
      </ScrollView>

      <View style={styles.grid}>
        <Kpi icon="cash-outline" label="Receita prevista" value={money(summary.revenue)} />
        <Kpi icon="people-outline" label="Passagens vendidas" value={String(summary.sold)} />
        <Kpi icon="bus-outline" label="Viagens" value={String(summary.trips)} />
        <Kpi icon="pie-chart-outline" label="Ocupação média" value={`${summary.occupancy}%`} bar={summary.occupancy} />
      </View>

      <SectionTitle>Embarque</SectionTitle>
      <Text style={font.small}>Viagens com passagens compradas pelo app. Digite o código do passageiro para liberar.</Text>

      {appTrips.length === 0 ? (
        <Empty
          icon="qr-code-outline"
          title="Nenhuma passagem do app neste dia"
          text="Compre uma passagem pela aba Buscar para testar a validação de embarque aqui."
        />
      ) : (
        appTrips.map(({ trip, tickets: list }) => {
          const open = openTrip === trip.id;
          const passengers = list.flatMap((t) => t.passengers.map((p) => ({ ...p, status: t.status, code: t.code })));
          const boarded = passengers.filter((p) => p.status === 'boarded').length;
          return (
            <Card key={trip.id} style={{ gap: space.md }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>
                    {trip.departure} · {trip.from.name} → {trip.to.name}
                  </Text>
                  <Text style={font.small}>
                    {boarded}/{passengers.length} embarcados · {trip.vehicle.label}
                  </Text>
                </View>
                <Button
                  title={open ? 'Fechar' : 'Abrir'}
                  variant="secondary"
                  onPress={() => {
                    setOpenTrip(open ? null : trip.id);
                    setFeedback(null);
                    setCode('');
                  }}
                  style={{ minHeight: 44, paddingHorizontal: space.lg }}
                />
              </Row>

              {open && (
                <>
                  <Field
                    label="Código da passagem"
                    icon="keypad-outline"
                    placeholder="Ex.: K7Q2PA"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                    value={code}
                    onChangeText={(v) => {
                      setCode(v.toUpperCase());
                      setFeedback(null);
                    }}
                    onSubmitEditing={() => validate(trip.id)}
                  />
                  <Button title="Validar embarque" icon="checkmark-done" disabled={code.length < 6} onPress={() => validate(trip.id)} />
                  {feedback && (
                    <Row
                      style={{ ...styles.feedback, backgroundColor: feedback.ok ? colors.accentSoft : colors.dangerSoft }}
                      gap={space.sm}>
                      <Icon name={feedback.ok ? 'checkmark-circle' : 'close-circle'} color={feedback.ok ? '#0F766E' : colors.danger} />
                      <Text style={{ flex: 1, color: feedback.ok ? '#0F766E' : colors.danger, fontWeight: '600' }} accessibilityLiveRegion="assertive">
                        {feedback.text}
                      </Text>
                    </Row>
                  )}
                  <View style={{ gap: space.sm }}>
                    {passengers.map((p) => (
                      <Row key={`${p.code}-${p.seat}`} style={{ justifyContent: 'space-between' }}>
                        <Text style={font.body}>
                          <Text style={{ fontWeight: '800', color: colors.brand }}>{p.seat}</Text> · {p.name}
                        </Text>
                        <StatusBadge status={p.status} />
                      </Row>
                    ))}
                  </View>
                </>
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function Kpi({ icon, label, value, bar }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string; bar?: number }) {
  return (
    <View style={styles.kpi}>
      <Icon name={icon} size={20} color={colors.brand} />
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={font.small}>{label}</Text>
      {bar !== undefined && (
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${bar}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  kpi: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: 4,
  },
  kpiValue: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: space.sm },
  barTrack: { height: 6, backgroundColor: colors.brandSoft, borderRadius: 3, marginTop: space.sm, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: colors.brand, borderRadius: 3 },
  feedback: { padding: space.md, borderRadius: radius.md },
});
