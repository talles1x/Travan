import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, type TextInputInstance } from 'react-native';

import { Button, Field, Screen } from '@/components/ui';
import { colors, font } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function Login() {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) setError(res.error);
    else router.replace('/home');
  };

  return (
    <Screen footer={<Button title="Entrar" onPress={submit} loading={loading} />}>
      <Text style={font.title}>Bem-vindo de volta</Text>
      <Text style={font.small}>Entre para ver suas passagens e comprar novas.</Text>

      <Field
        label="E-mail"
        icon="mail-outline"
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setError('');
        }}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Field
        ref={passwordRef}
        label="Senha"
        icon="lock-closed-outline"
        placeholder="Sua senha"
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError('');
        }}
        onSubmitEditing={submit}
        error={error}
      />

      <Text style={[font.small, { textAlign: 'center' }]}>
        Ainda não tem conta?{' '}
        <Link href="/register" replace style={{ color: colors.brand, fontWeight: '700' }}>
          Criar conta
        </Link>
      </Text>
    </Screen>
  );
}
