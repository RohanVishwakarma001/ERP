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
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react-native';
import { mobileStudentService } from '@/services/mobile-services';

export function StudentScheduleView() {
  const [selectedDay, setSelectedDay] = useState<'MON' | 'TUE' | 'WED' | 'THU' | 'FRI'>('MON');
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const DAYS = [
    { key: 'MON', label: 'Mon', date: 'Monday' },
    { key: 'TUE', label: 'Tue', date: 'Tuesday' },
    { key: 'WED', label: 'Wed', date: 'Wednesday' },
    { key: 'THU', label: 'Thu', date: 'Thursday' },
    { key: 'FRI', label: 'Fri', date: 'Friday' },
  ];

  useEffect(() => {
    let isMounted = true;
    async function loadSchedule() {
      setIsLoading(true);
      try {
        const data = await mobileStudentService.getTimetable(selectedDay);
        if (isMounted) {
          setSlots(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load schedule', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadSchedule();
    return () => {
      isMounted = false;
    };
  }, [selectedDay]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Day Selector Pill Strip */}
      <View style={styles.daySelector}>
        {DAYS.map((d) => {
          const isSelected = selectedDay === d.key;
          return (
            <TouchableOpacity
              key={d.key}
              style={[styles.dayCard, isSelected && styles.activeDayCard]}
              onPress={() => setSelectedDay(d.key as any)}
            >
              <Text style={[styles.dayLabel, isSelected && styles.activeDayText]}>{d.label}</Text>
              <Text style={[styles.dayDate, isSelected && styles.activeDayDate]}>{d.date}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Slots List */}
      <View style={styles.slotsList}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0B3B60" style={{ marginVertical: 20 }} />
        ) : slots.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No timetable sessions scheduled for {selectedDay}.</Text>
          </View>
        ) : (
          slots.map((slot) => {
            const isLive = slot.status === 'LIVE';
            const isBreak = slot.status === 'BREAK';

            return (
              <View
                key={slot.id || slot.period}
                style={[
                  styles.slotCard,
                  isLive && styles.liveCard,
                  isBreak && styles.breakCard,
                ]}
              >
                <View style={styles.periodCol}>
                  <Text style={styles.periodNum}>P{slot.period || slot.periodNumber}</Text>
                  <Text style={styles.slotTime}>
                    {slot.time ? slot.time.split(' - ')[0] : slot.timeSlot || ''}
                  </Text>
                  {isLive && (
                    <View style={styles.liveTag}>
                      <Text style={styles.liveTagText}>NOW</Text>
                    </View>
                  )}
                </View>

                <View style={styles.slotDetails}>
                  <View style={styles.slotTopRow}>
                    <Text style={styles.slotCode}>{slot.code || slot.subjectCode}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{slot.type || (slot.isLab ? 'Lab' : 'Lecture')}</Text>
                    </View>
                  </View>

                  <Text style={styles.slotSubject}>{slot.subject || slot.subjectName}</Text>

                  <View style={styles.slotMeta}>
                    <View style={styles.metaRow}>
                      <User size={12} color="#64748B" />
                      <Text style={styles.metaText}>{slot.faculty || slot.facultyName}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <MapPin size={12} color="#64748B" />
                      <Text style={styles.metaText}>{slot.room || slot.roomNumber}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
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
  daySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  dayCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  activeDayCard: {
    backgroundColor: '#0B3B60',
    borderColor: '#0B3B60',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dayDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  activeDayText: {
    color: '#FFFFFF',
  },
  activeDayDate: {
    color: '#BAE6FD',
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
  liveCard: {
    borderColor: '#0284C7',
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  breakCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    opacity: 0.8,
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
  slotTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
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
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '700',
  },
  slotSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  slotMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
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
