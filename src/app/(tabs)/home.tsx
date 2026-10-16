import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityPicker } from '@/components/CityPicker';
import { Button, Card, Chip, Icon, Row, SectionTitle, StatusBadge } from '@/components/ui';
import { HIT, colors, font, radius, space } from '@/constants/theme';
import { cities, cityById, destinationsFrom, getTrip, nextDays, routes } from '@/lib/catalog';
import { dayChip, departureTime, friendlyDate, money } from '@/lib/format';
import { useStore } from '@/lib/store';
import { useNow } from '@/hooks/use-now';
import type { City } from '@/lib/types';

const popular = ['mon-cg', 'cg-jp', 'mon-jp', 'pat-cg'];

export default function Home() {
  const { user, myTickets } = useStore();
  const now = useNow();
  const days = useMemo(() => nextDays(14), []);
  const [from, setFrom] = useState<City>(cityById('mon'));
  const [to, setTo] = useState<City | null>(cityById('cg'));
  const [date, setDate] = useState(days[0]);
  const [qty, setQty] = useState(1);
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);

  const destinations = useMemo(() => destinationsFrom(from.id), [from]);
  const canSwap = !!to && routes.some((r) => r.from === to.id && r.to === from.id);

  const nextTrip = useMemo(() => {
    const upcoming = myTickets
      .filter((t) => t.status === 'confirmed' || t.status === 'pending')
      .map((t) => ({ ticket: t, trip: getTrip(t.tripId)! }))
      .filter((x) => x.trip && departureTime(x.trip.date, x.trip.departure) > now)
      .sort((a, b) => departureTime(a.trip.date, a.trip.departure) - departureTime(b.trip.date, b.trip.departure));
    return upcoming[0];
  }, [myTickets, now]);

  const search = () => {
    if (!to) {
      setPicker('to');
      return;
    }
    router.push({ pathname: '/results', params: { from: from.id, to: to.id, date, qty: String(qty) } });
  };

  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <SafeAreaView edges={['top']}>
            <Text style={styles.hello}>Olá, {firstName}</Text>
            <Text style={styles.headline}>Para onde vamos?</Text>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          {/* -------- Busca -------- */}
          <Card style={styles.searchCard}>
            <View>
              <CityButton label="Saindo de" city={from} onPress={() => setPicker('from')} icon="radio-button-on" />
              <View style={styles.sep} />
              <CityButton label="Indo para" city={to} onPress={() => setPicker('to')} icon="location" />
              <Pressable
                onPress={() => {
                  if (!to) return;
                  setFrom(to);
                  setTo(from);
                }}
                disabled={!canSwap}
                accessibilityRole="button"
                accessibilityLabel="Inverter origem e destino"
                style={[styles.swap, !canSwap && { opacity: 0.4 }]}>
                <Icon name="swap-vertical" size={20} color={colors.brand} />
              </Pressable>
            </View>

            <Text style={[font.label, { marginTop: space.lg }]}>QUANDO</Text>
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

            <Row style={{ justifyContent: 'space-between', marginTop: space.lg }}>
              <View>
                <Text style={font.label}>PASSAGEIROS</Text>
                <Text style={font.small}>Até 4 por compra</Text>
              </View>
              <Row gap={space.md}>
                <Stepper icon="remove" disabled={qty === 1} onPress={() => setQty((q) => q - 1)} label="Menos um passageiro" />
                <Text style={[font.h2, { minWidth: 20, textAlign: 'center' }]} accessibilityLabel={`${qty} passageiros`}>
                  {qty}
                </Text>
                <Stepper icon="add" disabled={qty === 4} onPress={() => setQty((q) => q + 1)} label="Mais um passageiro" />
              </Row>
            </Row>

            <Button title="Buscar viagens" icon="search" onPress={search} style={{ marginTop: space.lg }} />
          </Card>

          {/* -------- Próxima viagem -------- */}
          {nextTrip && (
            <>
              <SectionTitle>Sua próxima viagem</SectionTitle>
              <Card onPress={() => router.push(`/ticket/${nextTrip.ticket.id}`)}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ gap: 4, flex: 1 }}>
                    <Text style={font.h3}>
                      {nextTrip.trip.from.name} → {nextTrip.trip.to.name}
                    </Text>
                    <Text style={font.small}>
                      {friendlyDate(nextTrip.trip.date)} · {nextTrip.trip.departure} · {nextTrip.ticket.passengers.length}{' '}
                      {nextTrip.ticket.passengers.length > 1 ? 'passageiros' : 'passageiro'}
                    </Text>
                  </View>
                  <StatusBadge status={nextTrip.ticket.status} />
                </Row>
              </Card>
            </>
          )}

          {/* -------- Rotas populares -------- */}
          <SectionTitle>Rotas mais procuradas</SectionTitle>
          <View style={{ gap: space.sm }}>
            {popular.map((id) => {
              const r = routes.find((x) => x.id === id)!;
              return (
                <Card
                  key={id}
                  style={{ paddingVertical: space.md }}
                  onPress={() => {
                    setFrom(cityById(r.from));
                    setTo(cityById(r.to));
                    router.push({ pathname: '/results', params: { from: r.from, to: r.to, date, qty: String(qty) } });
                  }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={[font.h3, { flex: 1 }]}>
                      {cityById(r.from).name} → {cityById(r.to).name}
                    </Text>
                    <Row gap={4}>
                      <Text style={font.small}>a partir de</Text>
                      <Text style={{ fontWeight: '800', color: colors.brand }}>{money(Math.round(r.price * 0.9))}</Text>
                      <Icon name="chevron-forward" size={18} color={colors.muted} />
                    </Row>
                  </Row>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <CityPicker
        visible={picker === 'from'}
        title="Saindo de"
        cities={cities}
        selectedId={from.id}
        onClose={() => setPicker(null)}
        onSelect={(c) => {
          setFrom(c);
          if (to && !destinationsFrom(c.id).some((d) => d.id === to.id)) setTo(null);
        }}
      />
      <CityPicker
        visible={picker === 'to'}
        title={`Destinos saindo de ${from.name}`}
        cities={destinations}
        selectedId={to?.id}
        onClose={() => setPicker(null)}
        onSelect={setTo}
      />
    </View>
  );
}

function CityButton({
  label,
  city,
  onPress,
  icon,
}: {
  label: string;
  city: City | null;
  onPress: () => void;
  icon: 'radio-button-on' | 'location';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${city ? city.name : 'escolher'}`}
      style={({ pressed }) => [styles.cityButton, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={18} color={colors.brand} />
      <View style={{ flex: 1 }}>
        <Text style={font.small}>{label}</Text>
        <Text style={[font.h3, { fontSize: 17 }, !city && { color: colors.muted }]}>{city ? city.name : 'Escolha o destino'}</Text>
      </View>
    </Pressable>
  );
}

function Stepper({ icon, onPress, disabled, label }: { icon: 'add' | 'remove'; onPress: () => void; disabled?: boolean; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.stepper, disabled && { opacity: 0.35 }]}>
      <Icon name={icon} size={20} color={colors.brand} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brandDark,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: 72,
  },
  hello: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: space.sm },
  headline: { color: colors.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 4 },
  body: { paddingHorizontal: space.lg, marginTop: -56, gap: space.md },
  searchCard: { padding: space.lg, borderRadius: radius.lg, shadowColor: '#1A002A', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  cityButton: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingRight: 56 },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 30 },
  swap: {
    position: 'absolute',
    right: 0,
    top: 36,
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    width: HIT - 4,
    height: HIT - 4,
    borderRadius: (HIT - 4) / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
