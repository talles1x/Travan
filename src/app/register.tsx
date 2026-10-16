import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, type TextInputInstance } from 'react-native';

import { Button, Field, Screen } from '@/components/ui';
import { colors, font } from '@/constants/theme';
import { maskPhone } from '@/lib/format';
import { useStore } from '@/lib/store';

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'form', string>>;

export default function Register() {
  const { register } = useStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: key === 'phone' ? maskPhone(value) : value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (form.name.trim().split(/\s+/).length < 2) e.name = 'Digite nome e sobrenome.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'E-mail inválido.';
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Telefone com DDD.';
    if (form.password.length < 6) e.password = 'Use pelo menos 6 caracteres.';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (!res.ok) setErrors({ email: res.error });
    else router.replace('/home');
  };

  return (
    <Screen footer={<Button title="Criar conta" onPress={submit} loading={loading} />}>
      <Text style={font.title}>Crie sua conta</Text>
      <Text style={font.small}>Leva menos de um minuto.</Text>

      <Field
        label="Nome completo"
        icon="person-outline"
        placeholder="Como está no documento"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        value={form.name}
        onChangeText={set('name')}
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.name}
      />
      <Field
        ref={emailRef}
        label="E-mail"
        icon="mail-outline"
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        value={form.email}
        onChangeText={set('email')}
        onSubmitEditing={() => phoneRef.current?.focus()}
        error={errors.email}
      />
      <Field
        ref={phoneRef}
        label="Celular"
        icon="call-outline"
        placeholder="(83) 99999-9999"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        value={form.phone}
        onChangeText={set('phone')}
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.phone}
        hint="Usado para avisos da viagem."
      />
      <Field
        ref={passwordRef}
        label="Senha"
        icon="lock-closed-outline"
        placeholder="Mínimo de 6 caracteres"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        value={form.password}
        onChangeText={set('password')}
        onSubmitEditing={submit}
        error={errors.password}
      />

      <Text style={[font.small, { textAlign: 'center' }]}>
        Já tem conta?{' '}
        <Link href="/login" replace style={{ color: colors.brand, fontWeight: '700' }}>
          Entrar
        </Link>
      </Text>
    </Screen>
  );
}
