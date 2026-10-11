import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import { QrCode, MapPin, Users } from 'lucide-react-native';
import { QueryState } from '@/components/common/query-state';
import { useTodayClasses, useWorkload } from '@/features/faculty';
import { initials } from '@/lib/format';
import type { FacultyClassItem } from '@/types';

interface FacultyHomeViewProps {
  onOpenBroadcaster: (classItem: FacultyClassItem) => void;
  onNavigateTab: (tab: string) => void;
}

export function FacultyHomeView({ onOpenBroadcaster, onNavigateTab }: FacultyHomeViewProps) {
  const { user } = useAuthStore();
  const classes = useTodayClasses();
  const workload = useWorkload();

  const list = classes.data ?? [];
  const activeClass = list.find((c) => c.status === 'LIVE') ?? list.find((c) => c.status === 'UPCOMING');
  const w = workload.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroSalutation}>Faculty Hub</Text>
            <Text style={styles.heroName}>{user?.name}</Text>
            <Text style={styles.heroSubtext}>{[user?.designation, user?.department].filter(Boolean).join(' • ')}</Text>
          </View>
          <View style={[styles.avatarWrapper, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials(user?.name)}</Text>
          </View>
        </View>

        <View style={styles.workloadBar}>
          <View style={styles.workloadItem}>
            <Text style={styles.workloadLabel}>AICTE TEACHING LOAD</Text>
            <View style={styles.workloadRow}>
              <Text style={styles.workloadValue}>{w ? `${w.weeklyContactHours} / ${w.aicteStandardHours}` : '—'}</Text>
              <Text style={styles.workloadUnit}>hrs/wk</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.workloadItem}>
            <Text style={styles.workloadLabel}>TODAY&apos;S CLASSES</Text>
            <View style={styles.workloadRow}>
              <Text style={styles.workloadValue}>{classes.data ? list.length : '—'}</Text>
            </View>
          </View>
        </View>
      </View>

      {activeClass && (
        <View style={styles.liveBanner}>
          <View style={styles.liveHeader}>
            <View style={styles.liveBadge}>
              <View style={styles.pulsingDot} />
              <Text style={styles.liveBadgeText}>
                PERIOD {activeClass.period} {activeClass.status === 'LIVE' ? 'IN SESSION' : 'UP NEXT'}
              </Text>
            </View>
            <Text style={styles.liveTime}>{activeClass.time}</Text>
          </View>
          <Text style={styles.liveSubject}>
            {activeClass.subjectCode} {activeClass.subjectName}
          </Text>
          <Text style={styles.liveSection}>
            Section {activeClass.section} • {activeClass.room} • {activeClass.totalStudents} students
          </Text>
          <TouchableOpacity style={styles.broadcastBtn} onPress={() => onOpenBroadcaster(activeClass)} activeOpacity={0.8}>
            <QrCode size={18} color="#FFFFFF" />
            <Text style={styles.broadcastBtnText}>Broadcast Classroom QR Code</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sectionHeaderBetween}>
        <Text style={styles.sectionTitle}>TODAY&apos;S CLASSES</Text>
        <TouchableOpacity onPress={() => onNavigateTab('timetable')}>
          <Text style={styles.viewAllText}>Weekly Timetable →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.classesList}>
        <QueryState query={classes} emptyText="No classes scheduled for today.">
          {(items) =>
            items.map((cls) => {
              const isCompleted = cls.status === 'COMPLETED';
              const isLive = cls.status === 'LIVE';
              return (
                <View key={cls.id} style={[styles.classCard, isLive && styles.liveClassCard]}>
                  <View style={styles.classTimeCol}>
                    <Text style={styles.classPeriod}>P{cls.period}</Text>
                    <Text style={styles.classTime}>{cls.time.split(' - ')[0]}</Text>
                  </View>
                  <View style={styles.classDetails}>
                    <View style={styles.classTopRow}>
                      <Text style={styles.classCode}>{cls.subjectCode}</Text>
                      <View style={[styles.statusPill, isCompleted ? styles.completedPill : isLive ? styles.livePill : styles.upcomingPill]}>
                        <Text style={[styles.statusPillText, isCompleted ? styles.completedText : isLive ? styles.liveText : styles.upcomingText]}>
                          {cls.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.className}>{cls.subjectName}</Text>
                    <View style={styles.classMeta}>
                      <Text style={styles.classSection}>{cls.section}</Text>
                      <Text style={styles.metaBullet}>•</Text>
                      <View style={styles.roomRow}>
                        <MapPin size={11} color="#64748B" />
                        <Text style={styles.roomText}>{cls.room}</Text>
                      </View>
                      <Text style={styles.metaBullet}>•</Text>
                      <View style={styles.roomRow}>
                        <Users size={11} color="#64748B" />
                        <Text style={styles.roomText}>
                          {cls.markedPresent}/{cls.totalStudents} present
                        </Text>
                      </View>
                    </View>
                    <View style={styles.classActions}>
                      <TouchableOpacity style={styles.actionButton} onPress={() => onNavigateTab('attendance')}>
                        <Text style={styles.actionBtnText}>{isCompleted ? 'Review Attendance' : 'Mark Attendance'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
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
    fontWeight: '700',
    textTransform: 'uppercase',
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
  workloadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B3B60',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  workloadItem: {
    flex: 1,
  },
  workloadLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#737378',
    letterSpacing: 0.5,
  },
  workloadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  workloadValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  workloadUnit: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
  },
  liveBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#0B6AA8',
    ...Shadows.sm,
    gap: 8,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0B6AA8',
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B6AA8',
  },
  liveTime: {
    fontSize: 12,
    color: '#636366',
    fontWeight: '600',
  },
  liveSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  liveSection: {
    fontSize: 12,
    color: '#636366',
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B3B60',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  broadcastBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
  classesList: {
    gap: 12,
  },
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  liveClassCard: {
    borderColor: '#0B6AA8',
    borderLeftWidth: 4,
    borderLeftColor: '#0B6AA8',
    backgroundColor: '#F0F9FF',
  },
  classTimeCol: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F2F2F7',
    paddingRight: 8,
  },
  classPeriod: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0B3B60',
  },
  classTime: {
    fontSize: 12,
    color: '#737378',
    marginTop: 2,
  },
  classDetails: {
    flex: 1,
    paddingLeft: 12,
    gap: 4,
  },
  classTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3B60',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  completedPill: {
    backgroundColor: '#ECFDF5',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  livePill: {
    backgroundColor: '#E0F2FE',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B6AA8',
  },
  upcomingPill: {
    backgroundColor: '#F2F2F7',
  },
  upcomingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#636366',
  },
  className: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  classMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  classSection: {
    fontSize: 12,
    fontWeight: '600',
    color: '#48484A',
  },
  metaBullet: {
    fontSize: 12,
    color: '#D1D1D6',
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  roomText: {
    fontSize: 12,
    color: '#636366',
  },
  classActions: {
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3B60',
  },
  alertsList: {
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
    ...Shadows.sm,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  alertSub: {
    fontSize: 12,
    color: '#636366',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
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
