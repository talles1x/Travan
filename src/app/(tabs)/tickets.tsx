import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Chip, Empty, Row, Screen, StatusBadge } from '@/components/ui';
import { colors, font, space } from '@/constants/theme';
import { getTrip } from '@/lib/catalog';
import { departureTime, friendlyDate, money } from '@/lib/format';
import { useStore } from '@/lib/store';
import { useNow } from '@/hooks/use-now';

export default function Tickets() {
  const { myTickets } = useStore();
  const now = useNow();
  const [tab, setTab] = useState<'next' | 'past'>('next');

  const { upcoming, past } = useMemo(() => {
    const withTrip = myTickets
      .map((t) => ({ ticket: t, trip: getTrip(t.tripId)! }))
      .filter((x) => x.trip)
      .sort((a, b) => departureTime(a.trip.date, a.trip.departure) - departureTime(b.trip.date, b.trip.departure));
    return {
      upcoming: withTrip.filter(
        (x) => (x.ticket.status === 'confirmed' || x.ticket.status === 'pending') && departureTime(x.trip.date, x.trip.departure) > now,
      ),
      past: withTrip
        .filter((x) => !(x.ticket.status === 'confirmed' || x.ticket.status === 'pending') || departureTime(x.trip.date, x.trip.departure) <= now)
        .reverse(),
    };
  }, [myTickets, now]);

  const list = tab === 'next' ? upcoming : past;

  return (
    <Screen edges={[]}>
      <Row>
        <Chip label={`Próximas (${upcoming.length})`} selected={tab === 'next'} onPress={() => setTab('next')} />
        <Chip label="Histórico" selected={tab === 'past'} onPress={() => setTab('past')} />
      </Row>

      {list.length === 0 ? (
        <Empty
          icon="ticket-outline"
          title={tab === 'next' ? 'Nenhuma viagem marcada' : 'Seu histórico está vazio'}
          text={tab === 'next' ? 'Quando você comprar uma passagem, ela aparece aqui com o QR code de embarque.' : 'Viagens feitas e canceladas ficam aqui.'}
          action={tab === 'next' ? <Button title="Buscar viagens" onPress={() => router.navigate('/home')} /> : undefined}
        />
      ) : (
        list.map(({ ticket, trip }) => (
          <Card key={ticket.id} onPress={() => router.push(`/ticket/${ticket.id}`)}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={font.h3}>
                  {trip.from.name} → {trip.to.name}
                </Text>
                <Text style={font.small}>
                  {friendlyDate(trip.date)} · {trip.departure} · assento{ticket.passengers.length > 1 ? 's' : ''}{' '}
                  {ticket.passengers.map((p) => p.seat).join(', ')}
                </Text>
              </View>
              <StatusBadge status={ticket.status} />
            </Row>
            <Row style={{ justifyContent: 'space-between', marginTop: space.md }}>
              <Text style={[font.small, { color: colors.text }]}>Código {ticket.code}</Text>
              <Text style={{ fontWeight: '700', color: colors.text }}>{money(ticket.total)}</Text>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
