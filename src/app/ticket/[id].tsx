import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button, Card, Empty, Icon, Row, Screen, StatusBadge } from '@/components/ui';
import { colors, font, radius, space } from '@/constants/theme';
import { getTrip } from '@/lib/catalog';
import { departureTime, duration, friendlyDate, money } from '@/lib/format';
import { CANCEL_LIMIT_MS, useStore } from '@/lib/store';
import { useNow } from '@/hooks/use-now';

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tickets, cancel } = useStore();
  const now = useNow();
  const ticket = tickets.find((t) => t.id === id);
  const trip = ticket && getTrip(ticket.tripId);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');

  if (!ticket || !trip) {
    return (
      <Screen>
        <Empty icon="ticket-outline" title="Passagem não encontrada" text="Ela pode ter sido removida." />
      </Screen>
    );
  }

  const active = ticket.status === 'confirmed';
  const canCancel =
    (ticket.status === 'confirmed' && departureTime(trip.date, trip.departure) - now > CANCEL_LIMIT_MS) ||
    ticket.status === 'pending';

  const share = () =>
    Share.share({
      message: `Minha passagem Travan: ${trip.from.name} → ${trip.to.name}, ${friendlyDate(trip.date)} às ${trip.departure}. Código ${ticket.code}.`,
    }).catch(() => {});

  const doCancel = async () => {
    const res = await cancel(ticket.id);
    setConfirming(false);
    setMessage(res.ok ? 'Passagem cancelada. O reembolso cai em até 2 dias úteis.' : res.error);
  };

  return (
    <Screen>
      {/* ---------- Bilhete ---------- */}
      <View style={styles.pass}>
        <View style={styles.passTop}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={styles.brand}>TRAVAN</Text>
            <StatusBadge status={ticket.status} />
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: space.lg }}>
            <View>
              <Text style={styles.city}>{trip.from.name}</Text>
              <Text style={styles.time}>{trip.departure}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Icon name="arrow-forward" size={20} color="rgba(255,255,255,0.6)" />
              <Text style={styles.dim}>{duration(trip.durationMin)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.city}>{trip.to.name}</Text>
              <Text style={styles.time}>{trip.arrival}</Text>
            </View>
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: space.lg }}>
            <Info label="Data" value={friendlyDate(trip.date)} />
            <Info label="Veículo" value={trip.vehicle.label.split(' ')[0]} />
            <Info label="Assentos" value={ticket.passengers.map((p) => p.seat).join(', ')} />
          </Row>
        </View>

        {/* recorte do bilhete */}
        <View style={styles.cut}>
          <View style={[styles.notch, { left: -12 }]} />
          <View style={styles.dashes} />
          <View style={[styles.notch, { right: -12 }]} />
        </View>

        <View style={styles.passBottom}>
          {active || ticket.status === 'boarded' ? (
            <>
              <View style={{ opacity: ticket.status === 'boarded' ? 0.35 : 1 }} accessible accessibilityLabel="QR code de embarque">
                <QRCode value={`TRAVAN:${ticket.code}`} size={170} color={colors.text} backgroundColor={colors.white} />
              </View>
              <Text style={styles.code} accessibilityLabel={`Código ${ticket.code.split('').join(' ')}`}>
                {ticket.code}
              </Text>
              <Text style={[font.small, { textAlign: 'center' }]}>
                {ticket.status === 'boarded'
                  ? 'Embarque registrado. Boa viagem!'
                  : 'Mostre este QR code ao motorista. Chegue 15 minutos antes.'}
              </Text>
            </>
          ) : ticket.status === 'pending' ? (
            <View style={{ gap: space.md, alignSelf: 'stretch' }}>
              <Text style={[font.small, { textAlign: 'center' }]}>O QR code aparece depois do pagamento.</Text>
              <Button title="Pagar com Pix" icon="flash" onPress={() => router.push(`/pix/${ticket.id}`)} />
            </View>
          ) : (
            <Text style={[font.small, { textAlign: 'center' }]}>Esta passagem não é mais válida para embarque.</Text>
          )}
        </View>
      </View>

      {/* ---------- Passageiros ---------- */}
      <Card style={{ gap: space.md }}>
        <Text style={font.h3}>Passageiros</Text>
        {ticket.passengers.map((p) => (
          <Row key={p.seat} style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={font.body}>{p.name}</Text>
              <Text style={font.small}>CPF ***.{p.document.slice(4, 7)}.***-**</Text>
            </View>
            <View style={styles.seatTag}>
              <Text style={{ fontWeight: '800', color: colors.brand }}>{p.seat}</Text>
            </View>
          </Row>
        ))}
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={font.small}>Total pago</Text>
          <Text style={font.h3}>{money(ticket.total)}</Text>
        </Row>
      </Card>

      {message ? (
        <Text style={[font.small, { color: colors.text, textAlign: 'center' }]} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      <View style={{ gap: space.sm }}>
        {active && <Button title="Compartilhar viagem" variant="secondary" icon="share-outline" onPress={share} />}
        {canCancel &&
          (confirming ? (
            <Card style={{ gap: space.md, borderColor: colors.danger }}>
              <Text style={font.h3}>Cancelar esta passagem?</Text>
              <Text style={font.small}>
                {ticket.status === 'pending'
                  ? 'A reserva será desfeita e os assentos liberados.'
                  : `Você recebe ${money(ticket.total)} de volta. Não dá para desfazer.`}
              </Text>
              <Row gap={space.sm}>
                <Button title="Manter" variant="secondary" onPress={() => setConfirming(false)} style={{ flex: 1 }} />
                <Button title="Cancelar" variant="danger" onPress={doCancel} style={{ flex: 1 }} />
              </Row>
            </Card>
          ) : (
            <Button title="Cancelar passagem" variant="danger" onPress={() => setConfirming(true)} />
          ))}
        {active && !canCancel && (
          <Text style={[font.small, { textAlign: 'center' }]}>
            Faltam menos de 3 horas para a partida: cancelamento só no guichê.
          </Text>
        )}
      </View>
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.dim}>{label}</Text>
      <Text style={{ color: colors.white, fontWeight: '700', fontSize: 15 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pass: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  passTop: { backgroundColor: colors.brand, padding: space.lg },
  brand: { color: colors.accent, fontWeight: '800', letterSpacing: 2, fontSize: 13 },
  city: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  time: { color: colors.white, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  dim: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  cut: { height: 24, justifyContent: 'center', backgroundColor: colors.card },
  notch: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg, top: 0 },
  dashes: { marginHorizontal: space.xl, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.border },
  passBottom: { padding: space.lg, paddingTop: space.sm, alignItems: 'center', gap: space.md },
  code: { fontSize: 26, fontWeight: '800', letterSpacing: 6, color: colors.text, fontVariant: ['tabular-nums'] },
  seatTag: {
    minWidth: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
