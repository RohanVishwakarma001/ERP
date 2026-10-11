import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Bell, ChevronLeft, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useNotifications } from '@/features/campus';
import { Colors, MinTouchTarget, Spacing, Type } from '@/constants/theme';
import type { UserRole } from '@/types';

const C = Colors.light;

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  HOD: 'Head of Department',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ACCOUNTANT: 'Accounts Officer',
  EXAM_OFFICER: 'Controller of Examinations',
  LIBRARIAN: 'Librarian',
  PLACEMENT_OFFICER: 'Placement Officer',
  HOSTEL_WARDEN: 'Hostel Warden',
  TRANSPORT_MANAGER: 'Transport Manager',
};

interface AppHeaderProps {
  onOpenCopilot?: () => void;
  onOpenNotifications: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  /** Title of the current section, shown beside the back button. */
  title?: string;
}

/** Top bar: brand (or back + section title on sub-tabs), copilot and notifications. */
export function AppHeader({ onOpenCopilot, onOpenNotifications, onBack, canGoBack = false, title }: AppHeaderProps) {
  const { user } = useAuthStore();
  const feed = useNotifications();
  const unread = feed.data?.unreadCount ?? 0;

  // Only facts we actually have — never placeholder department/semester values.
  const roleLine = user
    ? [ROLE_LABELS[user.role] ?? user.role, user.department, user.role === 'STUDENT' && user.semester ? `Sem ${user.semester}` : null]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <View style={styles.container}>
      {canGoBack && onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <ChevronLeft size={24} color={C.primaryContainer} />
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.brand}>
          <Image source={require('@/assets/images/jbit-logo.png')} style={styles.logo} contentFit="contain" accessibilityLabel="JBIT logo" />
          <View style={styles.brandText}>
            <Text style={styles.institution} numberOfLines={1}>
              JBIT Campus ERP
            </Text>
            {roleLine ? (
              <Text style={styles.role} numberOfLines={1}>
                {roleLine}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {onOpenCopilot && (
          <Pressable
            onPress={onOpenCopilot}
            accessibilityRole="button"
            accessibilityLabel="Ask the campus assistant"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Sparkles size={20} color={C.primaryContainer} />
          </Pressable>
        )}
        <Pressable
          onPress={onOpenNotifications}
          accessibilityRole="button"
          accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Bell size={20} color={C.text} />
          {unread > 0 && (
            <View style={styles.badge} importantForAccessibility="no-hide-descendants">
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  logo: { width: 36, height: 36 },
  brandText: { flex: 1, minWidth: 0 },
  institution: { ...Type.headline, color: C.text },
  role: { ...Type.caption, color: C.textSecondary, marginTop: 1 },
  back: { flexDirection: 'row', alignItems: 'center', minHeight: MinTouchTarget, marginLeft: -8, flex: 1, minWidth: 0 },
  title: { ...Type.headline, color: C.text, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: MinTouchTarget, height: MinTouchTarget, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.card,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
