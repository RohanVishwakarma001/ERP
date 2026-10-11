import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, MinTouchTarget, Radius, Shadows, Spacing, Type } from '@/constants/theme';

const C = Colors.light;

/** White rounded surface — the standard content container. */
export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

/** Section heading with an optional trailing action. */
export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'plain';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  /** Spoken label when it should differ from the visible one. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Pressable button with a 44pt minimum hit target and visible pressed state. */
export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, accessibilityLabel, style }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      hitSlop={4}
      style={({ pressed }) => [styles.button, BUTTON_VARIANTS[variant], pressed && styles.pressed, inactive && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator size="small" color={variant === 'primary' ? '#FFFFFF' : C.primaryContainer} /> : icon}
      <Text style={[styles.buttonText, { color: BUTTON_TEXT[variant] }]}>{label}</Text>
    </Pressable>
  );
}

const BUTTON_VARIANTS: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: C.primaryContainer },
  secondary: { backgroundColor: C.card, borderWidth: 1, borderColor: '#D1D1D6' },
  danger: { backgroundColor: C.dangerBg },
  plain: { backgroundColor: 'transparent', paddingHorizontal: Spacing.sm },
};
const BUTTON_TEXT: Record<ButtonVariant, string> = {
  primary: '#FFFFFF',
  secondary: C.text,
  danger: C.danger,
  plain: C.primaryContainer,
};

interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
}

/** Two-line list item; becomes a button with a full-width hit area when `onPress` is set. */
export function ListRow({ title, subtitle, leading, trailing, onPress, accessibilityHint }: ListRowProps) {
  const content = (
    <>
      {leading}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.backgroundElement }]}
    >
      {content}
    </Pressable>
  );
}

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'brand';
const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: C.successBg, fg: C.success },
  warning: { bg: C.warningBg, fg: C.warning },
  danger: { bg: C.dangerBg, fg: C.danger },
  neutral: { bg: C.backgroundElement, fg: C.textSecondary },
  brand: { bg: C.primaryLight, fg: C.primaryContainer },
};

/** Small status label — always text, so meaning never depends on colour alone. */
export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.pill, { backgroundColor: TONES[tone].bg }]}>
      <Text style={[styles.pillText, { color: TONES[tone].fg }]}>{label}</Text>
    </View>
  );
}

/** Rounded icon tile used as a ListRow leading element. */
export function IconTile({ children, tone = 'brand' }: { children: React.ReactNode; tone?: Tone }) {
  return <View style={[styles.iconTile, { backgroundColor: TONES[tone].bg }]}>{children}</View>;
}

export function EmptyNote({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.empty} accessible accessibilityRole="text">
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, ...Shadows.sm },
  cardPadded: { padding: Spacing.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm, minHeight: 28 },
  sectionTitle: { ...Type.headline, color: C.text },
  button: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonText: { ...Type.callout, fontWeight: '600' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, minHeight: MinTouchTarget + 12 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { ...Type.callout, color: C.text },
  rowSubtitle: { ...Type.subhead, color: C.textSecondary, marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  pillText: { ...Type.caption, fontWeight: '600' },
  iconTile: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: Spacing.xl, alignItems: 'center', gap: 4 },
  emptyTitle: { ...Type.callout, fontWeight: '600', color: C.text, textAlign: 'center' },
  emptyMessage: { ...Type.subhead, color: C.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
