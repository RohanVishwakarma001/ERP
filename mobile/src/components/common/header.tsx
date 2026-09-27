import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import { Bell, Sparkles, ChevronLeft } from 'lucide-react-native';

interface AppHeaderProps {
  onOpenCopilot: () => void;
  onOpenNotifications: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  title?: string;
}

export function AppHeader({
  onOpenCopilot,
  onOpenNotifications,
  onBack,
  canGoBack = false,
  title,
}: AppHeaderProps) {
  const { user } = useAuthStore();
  const isFaculty = user?.role === 'FACULTY' || user?.role === 'HOD';

  const roleDisplayLabel = () => {
    if (!user) return 'INSTITUTIONAL ERP';
    if (user.role === 'STUDENT') {
      return `STUDENT • ${user.department || 'B.TECH CSE'} (SEM ${user.semester || 6})`;
    }
    if (user.role === 'HOD') {
      return `HOD • ${user.department || 'CSE'}`;
    }
    if (user.role === 'FACULTY') {
      return `FACULTY • ${user.department || 'CSE'}`;
    }
    return `${user.role} • ${user.department || 'CAMPUS'}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandingRow}>
        {canGoBack && onBack ? (
          /* iOS / Android Navigation Back Affordance for Sub-pages */
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ChevronLeft size={22} color="#0B3B60" />
            <Text style={styles.backBtnText}>
              {title ? `Back to ${title}` : 'Back'}
            </Text>
          </TouchableOpacity>
        ) : (
          /* Root Dashboard Brand Title */
          <View style={styles.logoGroup}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>JBIT</Text>
            </View>
            <View>
              <Text style={styles.institutionName}>JB INSTITUTE OF TECH</Text>
              <View style={styles.roleTagRow}>
                <View
                  style={[
                    styles.roleDot,
                    isFaculty ? styles.facultyDot : styles.studentDot,
                  ]}
                />
                <Text style={styles.roleText}>{roleDisplayLabel()}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionGroup}>
          {/* AI Copilot shortcut */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenCopilot}
            activeOpacity={0.7}
            accessibilityLabel="Open Campus AI Copilot"
            accessibilityRole="button"
          >
            <Sparkles size={18} color="#0284C7" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.7}
            accessibilityLabel="Open Notifications"
            accessibilityRole="button"
          >
            <Bell size={18} color="#0F172A" />
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    ...Shadows.sm,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 2,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B3B60',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#002541',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  institutionName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002541',
    letterSpacing: 0.5,
  },
  roleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  studentDot: {
    backgroundColor: '#10B981',
  },
  facultyDot: {
    backgroundColor: '#0284C7',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
