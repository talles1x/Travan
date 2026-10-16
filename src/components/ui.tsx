import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type ScrollViewProps,
  type TextInputInstance,
  type TextInputProps,
  type ColorValue,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HIT, colors, font, radius, space } from '@/constants/theme';
import type { TicketStatus } from '@/lib/types';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: ColorValue }) {
  return <Ionicons name={name} size={size} color={color as string} />;
}

/* ---------- Layout ---------- */

export function Screen({
  children,
  scroll = true,
  footer,
  edges = ['bottom'],
  ...rest
}: ScrollViewProps & {
  scroll?: boolean;
  footer?: React.ReactNode;
  edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView edges={edges} style={styles.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          {...rest}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scrollContent, { flex: 1 }]}>{children}</View>
      )}
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style, gap = space.sm }: { children: React.ReactNode; style?: ViewStyle; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/* ---------- Ações ---------- */

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'onDark';
  icon?: IconName;
  loading?: boolean;
};

export function Button({ title, variant = 'primary', icon, loading, disabled, style, ...rest }: ButtonProps) {
  const palette = {
    primary: { bg: colors.brand, fg: colors.white, border: colors.brand },
    secondary: { bg: colors.card, fg: colors.brand, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.brand, border: 'transparent' },
    danger: { bg: colors.card, fg: colors.danger, border: colors.border },
    onDark: { bg: 'transparent', fg: colors.white, border: 'rgba(255,255,255,0.3)' },
  }[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        isDisabled && { opacity: 0.45 },
        state.pressed && { opacity: 0.85 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} color={palette.fg} size={20} />}
          <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  sublabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  sublabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected && styles.chipSelected]}>
      {sublabel && <Text style={[styles.chipSub, selected && { color: colors.brandSoft }]}>{sublabel}</Text>}
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Formulário ---------- */

export const Field = forwardRef<TextInputInstance, TextInputProps & { label: string; error?: string; hint?: string; icon?: IconName }>(
  function Field({ label, error, hint, icon, secureTextEntry, ...rest }, ref) {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(!!secureTextEntry);
    return (
      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View
          style={[
            styles.inputWrap,
            focused && { borderColor: colors.brand },
            !!error && { borderColor: colors.danger },
          ]}>
          {icon && <Icon name={icon} color={colors.muted} size={18} />}
          <TextInput
            ref={ref}
            placeholderTextColor="#A19FB0"
            style={styles.input}
            accessibilityLabel={label}
            secureTextEntry={hidden}
            onFocus={(e) => {
              setFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              rest.onBlur?.(e);
            }}
            {...rest}
          />
          {secureTextEntry && (
            <Pressable
              onPress={() => setHidden((h) => !h)}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Mostrar senha' : 'Esconder senha'}
              hitSlop={12}>
              <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} color={colors.muted} size={20} />
            </Pressable>
          )}
        </View>
        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : hint ? (
          <Text style={font.small}>{hint}</Text>
        ) : null}
      </View>
    );
  },
);

/* ---------- Status ---------- */

const statusMap: Record<TicketStatus, { label: string; fg: string; bg: string; icon: IconName }> = {
  pending: { label: 'Aguardando Pix', fg: colors.warning, bg: colors.warningSoft, icon: 'time-outline' },
  confirmed: { label: 'Confirmada', fg: '#0F766E', bg: colors.accentSoft, icon: 'checkmark-circle' },
  boarded: { label: 'Embarcado', fg: colors.brand, bg: colors.brandSoft, icon: 'bus' },
  cancelled: { label: 'Cancelada', fg: colors.danger, bg: colors.dangerSoft, icon: 'close-circle' },
  expired: { label: 'Expirada', fg: colors.muted, bg: '#EFEDF4', icon: 'alert-circle-outline' },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const s = statusMap[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Icon name={s.icon} color={s.fg} size={14} />
      <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={28} color={colors.brand} />
      </View>
      <Text style={[font.h3, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[font.small, { textAlign: 'center', maxWidth: 280 }]}>{text}</Text>
      {action}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
      <Text style={font.h3} accessibilityRole="header">
        {children}
      </Text>
      {right}
    </Row>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  footer: {
    padding: space.lg,
    paddingBottom: space.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    minHeight: HIT + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  chip: {
    minHeight: HIT,
    minWidth: HIT,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.text },
  chipSub: { fontSize: 11, fontWeight: '600', color: colors.muted, textTransform: 'uppercase' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  inputWrap: {
    minHeight: HIT + 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: space.md },
  error: { fontSize: 13, color: colors.danger, fontWeight: '500' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.lg },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
});
