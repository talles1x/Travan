import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button, Card, Empty, Icon, Row, Screen } from '@/components/ui';
import { colors, font, radius, space } from '@/constants/theme';
import { getTrip } from '@/lib/catalog';
import { countdown, friendlyDate, money } from '@/lib/format';
import { pixPayload } from '@/lib/pix';
import { useStore } from '@/lib/store';

export default function PixScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { tickets, confirmPayment, cancel } = useStore();
  const ticket = tickets.find((t) => t.id === ticketId);
  const trip = ticket && getTrip(ticket.tripId);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const payload = useMemo(
    () =>
      ticket
        ? pixPayload({
            key: 'pagamentos@travan.app',
            name: 'TRAVAN PASSAGENS',
            city: 'MONTEIRO',
            amount: ticket.total,
            txid: `TRV${ticket.code}`,
          })
        : '',
    [ticket],
  );

  if (!ticket || !trip) {
    return (
      <Screen>
        <Empty icon="alert-circle-outline" title="Pagamento não encontrado" text="Veja suas passagens na aba Passagens." />
      </Screen>
    );
  }

  const left = ticket.expiresAt - now;
  const expired = ticket.status === 'pending' && left <= 0;

  if (ticket.status === 'confirmed') {
    return (
      <Screen
        footer={<Button title="Ver minha passagem" icon="qr-code" onPress={() => router.replace(`/ticket/${ticket.id}`)} />}>
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Icon name="checkmark" size={40} color={colors.white} />
          </View>
          <Text style={[font.title, { textAlign: 'center' }]}>Pagamento aprovado!</Text>
          <Text style={[font.small, { textAlign: 'center', fontSize: 15 }]}>
            {trip.from.name} → {trip.to.name}, {friendlyDate(trip.date).toLowerCase()} às {trip.departure}.{'\n'}
            Mostre o QR code da passagem ao motorista.
          </Text>
        </View>
      </Screen>
    );
  }

  if (expired || ticket.status === 'expired' || ticket.status === 'cancelled') {
    return (
      <Screen>
        <Empty
          icon="time-outline"
          title={ticket.status === 'cancelled' ? 'Reserva cancelada' : 'O tempo para pagar acabou'}
          text="Os assentos foram liberados. Você pode fazer uma nova busca."
          action={<Button title="Buscar de novo" onPress={() => router.dismissTo('/home')} />}
        />
      </Screen>
    );
  }

  const copy = async () => {
    await Clipboard.setStringAsync(payload);
    setCopied(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulate = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 900));
    await confirmPayment(ticket.id);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPaying(false);
  };

  return (
    <Screen
      footer={
        <View style={{ gap: space.sm }}>
          <Button title={copied ? 'Código copiado!' : 'Copiar código Pix'} icon={copied ? 'checkmark' : 'copy-outline'} onPress={copy} />
          <Button title="Simular pagamento aprovado" variant="secondary" loading={paying} onPress={simulate} />
        </View>
      }>
      <Row style={styles.timer} gap={space.sm}>
        <Icon name="time-outline" size={18} color={colors.warning} />
        <Text style={{ color: colors.warning, fontWeight: '600', flex: 1 }}>Pague em até</Text>
        <Text style={styles.timerValue} accessibilityLabel={`Faltam ${countdown(left)} minutos`}>
          {countdown(left)}
        </Text>
      </Row>

      <Card style={{ alignItems: 'center', gap: space.md }}>
        <Text style={font.small}>Total a pagar</Text>
        <Text style={styles.amount}>{money(ticket.total)}</Text>
        <View style={styles.qr} accessible accessibilityLabel="QR code do Pix">
          <QRCode value={payload} size={200} color={colors.text} backgroundColor={colors.white} />
        </View>
        <Text style={[font.small, { textAlign: 'center' }]}>
          Abra o app do seu banco, escolha Pix e leia o QR code ou use o “copia e cola”.
        </Text>
        <Pressable onPress={copy} accessibilityRole="button" accessibilityLabel="Copiar código Pix" style={styles.code}>
          <Text numberOfLines={2} style={styles.codeText}>
            {payload}
          </Text>
        </Pressable>
      </Card>

      <Text style={[font.small, { textAlign: 'center' }]}>
        Ambiente de demonstração: nenhum valor é cobrado.
      </Text>
      <Button
        title="Cancelar reserva"
        variant="ghost"
        onPress={async () => {
          await cancel(ticket.id);
          router.dismissTo('/home');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: space.md },
  timerValue: { color: colors.warning, fontWeight: '800', fontSize: 18, fontVariant: ['tabular-nums'] },
  amount: { fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  qr: { padding: space.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  code: { backgroundColor: colors.bg, borderRadius: radius.sm, padding: space.md, alignSelf: 'stretch' },
  codeText: { fontSize: 12, color: colors.muted, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  success: { alignItems: 'center', gap: space.md, paddingTop: space.xxl },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
});
