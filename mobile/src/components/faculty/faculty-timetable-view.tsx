import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import { Calendar, Clock, MapPin, Users, Award } from 'lucide-react-native';
import { mobileFacultyService } from '@/services/mobile-services';

export function FacultyTimetableView() {
  const [selectedDay, setSelectedDay] = useState<'MON' | 'TUE' | 'WED' | 'THU' | 'FRI'>('MON');
  const [slots, setSlots] = useState<any[]>([]);
  const [workload, setWorkload] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const DAYS = [
    { key: 'MON', label: 'Mon' },
    { key: 'TUE', label: 'Tue' },
    { key: 'WED', label: 'Wed' },
    { key: 'THU', label: 'Thu' },
    { key: 'FRI', label: 'Fri' },
  ];

  useEffect(() => {
    let isMounted = true;
    async function loadFacultySchedule() {
      setIsLoading(true);
      try {
        const [ttData, wlData] = await Promise.allSettled([
          mobileFacultyService.getFacultyTimetable(selectedDay),
          mobileFacultyService.getWorkload(),
        ]);
        if (isMounted) {
          if (ttData.status === 'fulfilled') setSlots(Array.isArray(ttData.value) ? ttData.value : []);
          if (wlData.status === 'fulfilled') setWorkload(wlData.value);
        }
      } catch (err) {
        console.error('Failed to load faculty timetable', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadFacultySchedule();
    return () => {
      isMounted = false;
    };
  }, [selectedDay]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. AICTE Compliance Card */}
      <View style={styles.complianceCard}>
        <View style={styles.complianceHeader}>
          <View>
            <Text style={styles.complianceSub}>AICTE WORKLOAD NORMS</Text>
            <Text style={styles.complianceTitle}>
              {workload?.weeklyContactHours ?? 18} Hours Weekly Contact
            </Text>
            <Text style={styles.complianceMeta}>
              Standard: {workload?.aicteStandardHours ?? 18} Hrs • 100% Statutory Norm
            </Text>
          </View>
          <View style={styles.badge}>
            <Award size={18} color="#059669" />
            <Text style={styles.badgeText}>{workload?.compliancePercentage ?? 100}% Norm</Text>
          </View>
        </View>
      </View>

      {/* 2. Day Switcher */}
      <View style={styles.dayStrip}>
        {DAYS.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={[styles.dayBtn, selectedDay === d.key && styles.activeDayBtn]}
            onPress={() => setSelectedDay(d.key as any)}
          >
            <Text style={[styles.dayBtnText, selectedDay === d.key && styles.activeDayBtnText]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. Schedule Slots */}
      <View style={styles.slotsList}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0B3B60" style={{ marginVertical: 20 }} />
        ) : slots.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No teaching periods allocated for {selectedDay}.</Text>
          </View>
        ) : (
          slots.map((slot) => (
            <View key={slot.id || slot.period} style={styles.slotCard}>
              <View style={styles.periodCol}>
                <Text style={styles.periodNum}>P{slot.period || slot.periodNumber}</Text>
                <Text style={styles.periodTime}>
                  {slot.time ? slot.time.split(' - ')[0] : slot.timeSlot || ''}
                </Text>
              </View>

              <View style={styles.slotDetails}>
                <View style={styles.slotTopRow}>
                  <Text style={styles.slotCode}>{slot.code || slot.subjectCode}</Text>
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>{slot.type || (slot.isLab ? 'Lab' : 'Theory')}</Text>
                  </View>
                </View>

                <Text style={styles.slotSubject}>{slot.subject || slot.subjectName}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.sectionText}>{slot.section || 'All Sections'}</Text>
                  <Text style={styles.bullet}>•</Text>
                  <View style={styles.roomRow}>
                    <MapPin size={11} color="#64748B" />
                    <Text style={styles.roomText}>{slot.room || slot.roomNumber}</Text>
                  </View>
                </View>
              </View>
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
  complianceCard: {
    backgroundColor: '#002541',
    borderRadius: 20,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complianceSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  complianceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  complianceMeta: {
    fontSize: 11,
    color: '#BAE6FD',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  dayStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  dayBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  activeDayBtn: {
    backgroundColor: '#0B3B60',
    borderColor: '#0B3B60',
  },
  dayBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  activeDayBtnText: {
    color: '#FFFFFF',
  },
  slotsList: {
    gap: 12,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  periodCol: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 8,
  },
  periodNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0B3B60',
  },
  periodTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  slotDetails: {
    flex: 1,
    paddingLeft: 12,
    gap: 4,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B3B60',
  },
  typePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  slotSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sectionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bullet: {
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
