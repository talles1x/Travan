import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Field, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { colors, font, space } from '@/constants/theme';
import { getTrip } from '@/lib/catalog';
import { friendlyDate, isValidCPF, maskCPF, money } from '@/lib/format';
import { useStore } from '@/lib/store';

type Form = { name: string; document: string };

export default function Checkout() {
  const { id, seats: seatsParam } = useLocalSearchParams<{ id: string; seats: string }>();
  const trip = getTrip(id)!;
  const seats = seatsParam.split(',').map(Number);
  const { user, reserve, occupiedSeats } = useStore();
  const [forms, setForms] = useState<Form[]>(seats.map((_, i) => ({ name: i === 0 ? user?.name ?? '' : '', document: '' })));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);

  const total = trip.price * seats.length;

  const update = (i: number, key: keyof Form, value: string) => {
    setForms((f) => f.map((x, j) => (j === i ? { ...x, [key]: key === 'document' ? maskCPF(value) : value } : x)));
    setErrors((e) => ({ ...e, [`${i}.${key}`]: undefined }));
  };

  const pay = async () => {
    const e: Record<string, string> = {};
    forms.forEach((f, i) => {
      if (f.name.trim().split(/\s+/).length < 2) e[`${i}.name`] = 'Nome e sobrenome, como no documento.';
      if (!isValidCPF(f.document)) e[`${i}.document`] = 'CPF inválido.';
    });
    const cpfs = forms.map((f) => f.document);
    cpfs.forEach((c, i) => {
      if (c && cpfs.indexOf(c) !== i) e[`${i}.document`] = 'Este CPF já está em outro assento.';
    });
    setErrors(e);
    if (Object.keys(e).length) return;

    // alguém pode ter comprado o assento enquanto a pessoa preenchia
    const taken = occupiedSeats(trip);
    if (seats.some((s) => taken.includes(s))) {
      setErrors({ form: 'Um dos assentos acabou de ser vendido. Volte e escolha outro.' });
      return;
    }

    setLoading(true);
    const ticket = await reserve(
      trip,
      forms.map((f, i) => ({ name: f.name.trim(), document: f.document, seat: seats[i] })),
    );
    setLoading(false);
    router.dismissTo('/home');
    router.push({ pathname: '/pix/[ticketId]', params: { ticketId: ticket.id } });
  };

  return (
    <Screen
      footer={
        <View style={{ gap: space.sm }}>
          {errors.form && <Text style={{ color: colors.danger, fontWeight: '600' }}>{errors.form}</Text>}
          <Button title={`Pagar ${money(total)} com Pix`} icon="flash" onPress={pay} loading={loading} />
        </View>
      }>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>
              {trip.from.name} → {trip.to.name}
            </Text>
            <Text style={[font.small, { marginTop: 4 }]}>
              {friendlyDate(trip.date)} · saída {trip.departure}
            </Text>
          </View>
          <EditButton />
        </Row>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: space.md }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={font.small}>
            {seats.length} × {money(trip.price)}
          </Text>
          <Text style={[font.h3, { color: colors.brand }]}>{money(total)}</Text>
        </Row>
      </Card>

      {forms.map((f, i) => (
        <View key={seats[i]} style={{ gap: space.md }}>
          <SectionTitle>{`Passageiro ${i + 1} · assento ${seats[i]}`}</SectionTitle>
          <Field
            label="Nome completo"
            icon="person-outline"
            value={f.name}
            onChangeText={(v) => update(i, 'name', v)}
            autoComplete={i === 0 ? 'name' : 'off'}
            error={errors[`${i}.name`]}
          />
          <Field
            label="CPF"
            icon="card-outline"
            placeholder="000.000.000-00"
            keyboardType="number-pad"
            value={f.document}
            onChangeText={(v) => update(i, 'document', v)}
            error={errors[`${i}.document`]}
            hint="Exigido pela ANTT no embarque."
          />
        </View>
      ))}

      <Row gap={space.sm} style={{ alignItems: 'flex-start' }}>
        <Icon name="shield-checkmark-outline" size={18} color={colors.accent} />
        <Text style={[font.small, { flex: 1 }]}>
          Os assentos ficam reservados por 10 minutos enquanto você paga. Cancelamento com reembolso até 3 horas antes da
          partida.
        </Text>
      </Row>
    </Screen>
  );
}

function EditButton() {
  return (
    <Button
      title="Alterar"
      variant="ghost"
      onPress={() => router.back()}
      style={{ minHeight: 44, paddingHorizontal: space.md }}
    />
  );
}
