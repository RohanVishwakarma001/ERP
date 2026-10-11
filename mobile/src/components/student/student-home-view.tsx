import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import { QrCode, Award, Sparkles, MapPin, FileCheck, CheckCircle2 } from 'lucide-react-native';
import { QueryState } from '@/components/common/query-state';
import { ATTENDANCE_THRESHOLD, useAttendanceSummary } from '@/features/attendance';
import { useNotices, useTodaySchedule } from '@/features/campus';
import { formatDate, initials } from '@/lib/format';

interface StudentHomeViewProps {
  onOpenQrScanner: () => void;
  onOpenCopilot: () => void;
  onNavigateTab: (tab: string) => void;
}

export function StudentHomeView({ onOpenQrScanner, onOpenCopilot, onNavigateTab }: StudentHomeViewProps) {
  const { user } = useAuthStore();
  const attendance = useAttendanceSummary();
  const schedule = useTodaySchedule();
  const notices = useNotices();

  const overall = attendance.data?.overallPercentage;
  const isSafe = overall !== undefined && overall >= ATTENDANCE_THRESHOLD;
  const liveClass = schedule.data?.find((s) => s.status === 'LIVE');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroSalutation}>Welcome back,</Text>
            <Text style={styles.heroName}>{user?.name}</Text>
            <Text style={styles.heroSubtext}>
              {[user?.department, user?.semester ? `Sem ${user.semester}` : null].filter(Boolean).join(' • ')}
            </Text>
          </View>
          <View style={[styles.avatarWrapper, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials(user?.name)}</Text>
          </View>
        </View>

        <View style={styles.heroKpiBar}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>OVERALL ATTENDANCE</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{overall === undefined ? '—' : `${overall}%`}</Text>
              {overall !== undefined && attendance.data!.totalClasses > 0 && (
                <View style={[styles.safeTag, !isSafe && styles.warnTag]}>
                  <Text style={styles.safeTagText}>{isSafe ? `SAFE (≥${ATTENDANCE_THRESHOLD}%)` : `BELOW ${ATTENDANCE_THRESHOLD}%`}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>CUMULATIVE CGPA</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{user?.cgpa?.toFixed(2) ?? '—'}</Text>
              <Award size={14} color="#F59E0B" />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      </View>
      <View style={styles.actionGrid}>
        <TouchableOpacity style={[styles.actionTile, styles.primaryActionTile]} onPress={onOpenQrScanner} activeOpacity={0.8}>
          <View style={styles.actionIconBadge}>
            <QrCode size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.primaryActionLabel}>Scan QR Attendance</Text>
          <Text style={styles.actionSublabel}>{liveClass ? `${liveClass.code} in session` : 'No class in session'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTile} onPress={() => onNavigateTab('academics')} activeOpacity={0.8}>
          <View style={[styles.actionIconBadge, { backgroundColor: '#E0F2FE' }]}>
            <FileCheck size={20} color="#0284C7" />
          </View>
          <Text style={styles.actionLabel}>Grade Card</Text>
          <Text style={styles.actionSublabel}>Results & assignments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTile} onPress={onOpenCopilot} activeOpacity={0.8}>
          <View style={[styles.actionIconBadge, { backgroundColor: '#FDF4FF' }]}>
            <Sparkles size={20} color="#A855F7" />
          </View>
          <Text style={styles.actionLabel}>Campus Copilot</Text>
          <Text style={styles.actionSublabel}>Ask about your records</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTile} onPress={() => onNavigateTab('attendance')} activeOpacity={0.8}>
          <View style={[styles.actionIconBadge, { backgroundColor: '#ECFDF5' }]}>
            <CheckCircle2 size={20} color="#10B981" />
          </View>
          <Text style={styles.actionLabel}>Subject Attendance</Text>
          <Text style={styles.actionSublabel}>{attendance.data ? `${attendance.data.subjects.length} subjects` : '—'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderBetween}>
        <Text style={styles.sectionTitle}>TODAY&apos;S SCHEDULE</Text>
        <TouchableOpacity onPress={() => onNavigateTab('schedule')}>
          <Text style={styles.viewAllText}>Full Week →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.scheduleList}>
        <QueryState query={schedule} emptyText="No classes scheduled for today.">
          {(slots) =>
            slots.map((item) => {
              const [start, end] = item.time.split(' - ');
              return (
                <View key={item.id} style={[styles.scheduleCard, item.status === 'LIVE' && styles.liveScheduleCard]}>
                  <View style={styles.scheduleTimeCol}>
                    <Text style={styles.scheduleTime}>{start}</Text>
                    <Text style={styles.scheduleTimeEnd}>{end}</Text>
                    {item.status === 'LIVE' && (
                      <View style={styles.liveTag}>
                        <Text style={styles.liveTagText}>NOW</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.scheduleDetailsCol}>
                    <View style={styles.scheduleHeaderRow}>
                      <Text style={styles.scheduleCode}>{item.code}</Text>
                      {item.isLab && (
                        <View style={styles.labBadge}>
                          <Text style={styles.labBadgeText}>LAB</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.scheduleSubject}>{item.subject}</Text>
                    <View style={styles.scheduleMetaRow}>
                      <Text style={styles.scheduleFaculty}>{item.faculty}</Text>
                      <Text style={styles.scheduleBullet}>•</Text>
                      <View style={styles.scheduleRoomRow}>
                        <MapPin size={11} color="#64748B" />
                        <Text style={styles.scheduleRoom}>{item.room}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          }
        </QueryState>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>LATEST NOTICES</Text>
      </View>
      <View style={styles.noticesList}>
        <QueryState query={notices} emptyText="No notices published at this time.">
          {(list) =>
            list.slice(0, 3).map((notice) => (
              <View key={notice.id} style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{notice.isUrgent ? `URGENT • ${notice.category}` : notice.category}</Text>
                  </View>
                  <Text style={styles.noticeDate}>{formatDate(notice.publishedAt)}</Text>
                </View>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeSummary} numberOfLines={2}>
                  {notice.summary}
                </Text>
              </View>
            ))
          }
        </QueryState>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatarFallback: {
    backgroundColor: Colors.light.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  warnTag: {
    backgroundColor: '#DC2626',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 32,
    gap: Spacing.lg,
  },
  heroCard: {
    backgroundColor: '#002541',
    borderRadius: 20,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSalutation: {
    fontSize: 12,
    color: '#93C5FD',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroSubtext: {
    fontSize: 12,
    color: '#BAE6FD',
    marginTop: 2,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#38BDF8',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  heroKpiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B3B60',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  kpiItem: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#737378',
    letterSpacing: 0.5,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  safeTag: {
    backgroundColor: '#065F46',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  safeTagText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#636366',
    letterSpacing: 0.8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3B60',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  primaryActionTile: {
    backgroundColor: '#0B3B60',
    borderColor: '#0B3B60',
  },
  actionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0B6AA8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryActionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  actionSublabel: {
    fontSize: 12,
    color: '#737378',
    marginTop: 2,
  },
  scheduleList: {
    gap: 10,
  },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  liveScheduleCard: {
    borderColor: '#0B6AA8',
    borderLeftWidth: 4,
    borderLeftColor: '#0B6AA8',
    backgroundColor: '#F0F9FF',
  },
  scheduleTimeCol: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F2F2F7',
    paddingRight: 8,
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  scheduleTimeEnd: {
    fontSize: 12,
    color: '#737378',
  },
  liveTag: {
    backgroundColor: '#0B6AA8',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  scheduleDetailsCol: {
    flex: 1,
    paddingLeft: 12,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3B60',
  },
  labBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  labBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#BB0112',
  },
  scheduleSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 2,
  },
  scheduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  scheduleFaculty: {
    fontSize: 12,
    color: '#636366',
  },
  scheduleBullet: {
    fontSize: 12,
    color: '#D1D1D6',
  },
  scheduleRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  scheduleRoom: {
    fontSize: 12,
    color: '#636366',
    fontWeight: '500',
  },
  transitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
    ...Shadows.sm,
  },
  transitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transitIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  transitRoute: {
    fontSize: 12,
    color: '#636366',
  },
  transitStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 10,
  },
  transitStatusCol: {},
  transitLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#737378',
  },
  transitArrival: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B3B60',
    marginTop: 2,
  },
  busLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  busLiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  noticesList: {
    gap: 10,
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
    ...Shadows.sm,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3B60',
  },
  noticeDate: {
    fontSize: 12,
    color: '#737378',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  noticeSummary: {
    fontSize: 12,
    color: '#636366',
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  emptyText: {
    fontSize: 12,
    color: '#636366',
    fontWeight: '500',
  },
});
