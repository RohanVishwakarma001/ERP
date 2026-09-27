import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import {
  QrCode,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { mobileFacultyService } from '@/services/mobile-services';
import { FacultyClassItem } from '@/types';

interface FacultyHomeViewProps {
  onOpenBroadcaster: () => void;
  onNavigateTab: (tab: string) => void;
}

export function FacultyHomeView({ onOpenBroadcaster, onNavigateTab }: FacultyHomeViewProps) {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<FacultyClassItem[]>([]);
  const [workload, setWorkload] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadFacultyHome() {
      try {
        const [clsData, wlData] = await Promise.allSettled([
          mobileFacultyService.getTodayClasses(),
          mobileFacultyService.getWorkload(),
        ]);
        if (isMounted) {
          if (clsData.status === 'fulfilled') setClasses(Array.isArray(clsData.value) ? clsData.value : []);
          if (wlData.status === 'fulfilled') setWorkload(wlData.value);
        }
      } catch (err) {
        console.error('Failed to load faculty home', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadFacultyHome();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeClass =
    classes.find((c) => c.status === 'LIVE') ||
    classes.find((c) => c.status === 'UPCOMING') ||
    classes[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Dr. Bhatt Academic Console Hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroSalutation}>Faculty Academic Hub,</Text>
            <Text style={styles.heroName}>{user?.name || 'Dr. V. K. Bhatt'}</Text>
            <Text style={styles.heroSubtext}>
              {user?.designation || 'Professor & Head of Department'} • {user?.department || 'Computer Science & Engineering'}
            </Text>
          </View>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Workload Metric Bar */}
        <View style={styles.workloadBar}>
          <View style={styles.workloadItem}>
            <Text style={styles.workloadLabel}>AICTE TEACHING LOAD</Text>
            <View style={styles.workloadRow}>
              <Text style={styles.workloadValue}>
                {workload?.weeklyContactHours ?? 18} / {workload?.aicteStandardHours ?? 18}
              </Text>
              <Text style={styles.workloadUnit}>Hrs/Wk ({workload?.compliancePercentage ?? 100}%)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.workloadItem}>
            <Text style={styles.workloadLabel}>TODAY'S CLASSES</Text>
            <View style={styles.workloadRow}>
              <Text style={styles.workloadValue}>{classes.length} Sessions</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Active Period Banner with 1-Tap QR Broadcaster */}
      {activeClass && (
        <View style={styles.liveBanner}>
          <View style={styles.liveHeader}>
            <View style={styles.liveBadge}>
              <View style={styles.pulsingDot} />
              <Text style={styles.liveBadgeText}>PERIOD {activeClass.period} {activeClass.status === 'LIVE' ? 'CURRENTLY LIVE' : 'TODAY'}</Text>
            </View>
            <Text style={styles.liveTime}>{activeClass.time}</Text>
          </View>

          <Text style={styles.liveSubject}>{activeClass.subjectCode} {activeClass.subjectName}</Text>
          <Text style={styles.liveSection}>Section {activeClass.section} • {activeClass.room} • {activeClass.totalStudents || 60} Students</Text>

          <TouchableOpacity
            style={styles.broadcastBtn}
            onPress={onOpenBroadcaster}
            activeOpacity={0.8}
          >
            <QrCode size={18} color="#FFFFFF" />
            <Text style={styles.broadcastBtnText}>Broadcast Classroom QR Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Today's Teaching Schedule */}
      <View style={styles.sectionHeaderBetween}>
        <Text style={styles.sectionTitle}>TODAY'S CLASS ROSTER</Text>
        <TouchableOpacity onPress={() => onNavigateTab('timetable')}>
          <Text style={styles.viewAllText}>Weekly Matrix →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.classesList}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0B3B60" style={{ marginVertical: 20 }} />
        ) : classes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No classes scheduled for today.</Text>
          </View>
        ) : (
          classes.map((cls) => {
          const isCompleted = cls.status === 'COMPLETED';
          const isLive = cls.status === 'LIVE';

          return (
            <View
              key={cls.id}
              style={[styles.classCard, isLive && styles.liveClassCard]}
            >
              <View style={styles.classTimeCol}>
                <Text style={styles.classPeriod}>P{cls.period}</Text>
                <Text style={styles.classTime}>{cls.time.split(' - ')[0]}</Text>
              </View>

              <View style={styles.classDetails}>
                <View style={styles.classTopRow}>
                  <Text style={styles.classCode}>{cls.subjectCode}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      isCompleted ? styles.completedPill : isLive ? styles.livePill : styles.upcomingPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isCompleted ? styles.completedText : isLive ? styles.liveText : styles.upcomingText,
                      ]}
                    >
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
                      {isCompleted ? `${cls.markedPresent}/${cls.totalStudents} Present` : `${cls.totalStudents} Students`}
                    </Text>
                  </View>
                </View>

                {/* Direct Action */}
                <View style={styles.classActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onNavigateTab('attendance')}
                  >
                    <Text style={styles.actionBtnText}>
                      {isCompleted ? 'View Attendance Register' : 'Mark Attendance Roster'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }))}
      </View>

      {/* 4. Pending Departmental Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>PENDING ACTIONS &amp; NOTIFICATIONS</Text>
      </View>
      <View style={styles.alertsList}>
        <View style={styles.alertCard}>
          <AlertCircle size={18} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>3 Attendance Petitions Pending Review</Text>
            <Text style={styles.alertSub}>CSE-6A students submitted medical on-duty slips.</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </View>

        <View style={styles.alertCard}>
          <ShieldCheck size={18} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Continuous Assessment (CIA-2) Window Open</Text>
            <Text style={styles.alertSub}>Deadline to submit marks to Exam Cell is June 5.</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
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
    fontSize: 11,
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
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
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
    fontSize: 11,
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
    borderColor: '#0284C7',
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
    backgroundColor: '#0284C7',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
  },
  liveTime: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  liveSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveSection: {
    fontSize: 12,
    color: '#64748B',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  viewAllText: {
    fontSize: 11,
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
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  liveClassCard: {
    borderColor: '#0284C7',
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  classTimeCol: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 8,
  },
  classPeriod: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0B3B60',
  },
  classTime: {
    fontSize: 10,
    color: '#94A3B8',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#0B3B60',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  completedPill: {
    backgroundColor: '#ECFDF5',
  },
  completedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  livePill: {
    backgroundColor: '#E0F2FE',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
  },
  upcomingPill: {
    backgroundColor: '#F1F5F9',
  },
  upcomingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  className: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  classMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  classSection: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  metaBullet: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  roomText: {
    fontSize: 11,
    color: '#64748B',
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
    fontSize: 11,
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
    borderColor: '#E2E8F0',
    gap: 12,
    ...Shadows.sm,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  alertSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
