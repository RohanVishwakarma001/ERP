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
  Award,
  Calendar,
  Sparkles,
  Bus,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { mobileStudentService, mobileNoticeService } from '@/services/mobile-services';
import { StudentScheduleItem, NoticeItem } from '@/types';

interface StudentHomeViewProps {
  onOpenQrScanner: () => void;
  onOpenCopilot: () => void;
  onNavigateTab: (tab: string) => void;
}

export function StudentHomeView({
  onOpenQrScanner,
  onOpenCopilot,
  onNavigateTab,
}: StudentHomeViewProps) {
  const { user } = useAuthStore();
  const [schedule, setSchedule] = useState<StudentScheduleItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [schedData, noticeData] = await Promise.allSettled([
          mobileStudentService.getTodaySchedule(),
          mobileNoticeService.getNotices(),
        ]);
        if (isMounted) {
          if (schedData.status === 'fulfilled') setSchedule(schedData.value || []);
          if (noticeData.status === 'fulfilled') setNotices(noticeData.value || []);
        }
      } catch (err) {
        console.error('Failed to load student home data', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Himalayan Greeting Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroSalutation}>Good Morning,</Text>
            <Text style={styles.heroName}>{user?.name || 'Aarav Sharma'}</Text>
            <Text style={styles.heroSubtext}>
              {user?.department} • Sem {user?.semester} (Sec A)
            </Text>
          </View>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Hero KPIs Bar */}
        <View style={styles.heroKpiBar}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>OVERALL ATTENDANCE</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{user?.overallAttendance || 84.5}%</Text>
              <View style={styles.safeTag}>
                <Text style={styles.safeTagText}>SAFE (&gt;75%)</Text>
              </View>
            </View>
          </View>

          <View style={styles.kpiDivider} />

          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>CUMULATIVE CGPA</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{user?.cgpa || 8.92}</Text>
              <Award size={14} color="#F59E0B" />
            </View>
          </View>
        </View>
      </View>

      {/* 2. Express Desk Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>EXPRESS ACTIONS</Text>
      </View>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionTile, styles.primaryActionTile]}
          onPress={onOpenQrScanner}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconBadge}>
            <QrCode size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.primaryActionLabel}>Scan QR Attendance</Text>
          <Text style={styles.actionSublabel}>Period 2 Active Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionTile}
          onPress={() => onNavigateTab('academics')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBadge, { backgroundColor: '#E0F2FE' }]}>
            <FileCheck size={20} color="#0284C7" />
          </View>
          <Text style={styles.actionLabel}>DigiLocker Grade Card</Text>
          <Text style={styles.actionSublabel}>Sem V Verified</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionTile}
          onPress={onOpenCopilot}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBadge, { backgroundColor: '#FDF4FF' }]}>
            <Sparkles size={20} color="#A855F7" />
          </View>
          <Text style={styles.actionLabel}>Campus Copilot</Text>
          <Text style={styles.actionSublabel}>Ask AI anything</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionTile}
          onPress={() => onNavigateTab('attendance')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBadge, { backgroundColor: '#ECFDF5' }]}>
            <CheckCircle2 size={20} color="#10B981" />
          </View>
          <Text style={styles.actionLabel}>Subject Attendance</Text>
          <Text style={styles.actionSublabel}>5 Subjects Active</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Today's Academic Schedule */}
      <View style={styles.sectionHeaderBetween}>
        <Text style={styles.sectionTitle}>TODAY&apos;S SCHEDULE</Text>
        <TouchableOpacity onPress={() => onNavigateTab('schedule')}>
          <Text style={styles.viewAllText}>Full Week →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.scheduleList}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 16 }} />
        ) : schedule.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No classes scheduled for today.</Text>
          </View>
        ) : (
          schedule.map((item) => (
            <View
              key={item.id}
              style={[
                styles.scheduleCard,
                item.status === 'LIVE' && styles.liveScheduleCard,
              ]}
            >
              <View style={styles.scheduleTimeCol}>
                <Text style={styles.scheduleTime}>{item.time ? item.time.split(' - ')[0] : ''}</Text>
                <Text style={styles.scheduleTimeEnd}>{item.time && item.time.includes(' - ') ? item.time.split(' - ')[1] : ''}</Text>
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
          ))
        )}
      </View>

      {/* 4. Campus Transit Telematics Bus ETA Widget */}
      <View style={styles.transitCard}>
        <View style={styles.transitHeader}>
          <View style={styles.transitIconBadge}>
            <Bus size={18} color="#0B3B60" />
          </View>
          <View>
            <Text style={styles.transitTitle}>JBIT Campus Transit (Route 12)</Text>
            <Text style={styles.transitRoute}>Clock Tower → Prem Nagar → JBIT Campus</Text>
          </View>
        </View>
        <View style={styles.transitStatusRow}>
          <View style={styles.transitStatusCol}>
            <Text style={styles.transitLabel}>SCHEDULED ARRIVAL</Text>
            <Text style={styles.transitArrival}>08:35 AM (Timetable estimate)</Text>
          </View>
          <View style={styles.busLivePill}>
            <Text style={styles.busLiveText}>No live GPS yet</Text>
          </View>
        </View>
      </View>

      {/* 5. Official Circulars & Notices */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>OFFICIAL CAMPUS GAZETTE</Text>
      </View>
      <View style={styles.noticesList}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 16 }} />
        ) : notices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No circulars published at this time.</Text>
          </View>
        ) : (
          notices.slice(0, 3).map((notice) => (
            <View key={notice.id} style={styles.noticeCard}>
              <View style={styles.noticeHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{notice.category}</Text>
                </View>
                <Text style={styles.noticeDate}>{notice.date}</Text>
              </View>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeSummary} numberOfLines={2}>
                {notice.summary}
              </Text>
            </View>
          ))
        )}
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
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
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
    fontSize: 9,
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
    borderColor: '#E2E8F0',
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
    backgroundColor: '#0284C7',
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
    color: '#0F172A',
  },
  actionSublabel: {
    fontSize: 11,
    color: '#94A3B8',
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
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  liveScheduleCard: {
    borderColor: '#0284C7',
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  scheduleTimeCol: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 8,
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  scheduleTimeEnd: {
    fontSize: 10,
    color: '#94A3B8',
  },
  liveTag: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 8,
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
    fontSize: 11,
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
    fontSize: 8,
    fontWeight: '800',
    color: '#BB0112',
  },
  scheduleSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  scheduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  scheduleFaculty: {
    fontSize: 11,
    color: '#64748B',
  },
  scheduleBullet: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  scheduleRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  scheduleRoom: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  transitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  transitRoute: {
    fontSize: 11,
    color: '#64748B',
  },
  transitStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  transitStatusCol: {},
  transitLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
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
    fontSize: 10,
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
    borderColor: '#E2E8F0',
    gap: 6,
    ...Shadows.sm,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0B3B60',
  },
  noticeDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  noticeSummary: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
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
