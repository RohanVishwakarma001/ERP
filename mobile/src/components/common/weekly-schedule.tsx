import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapPin, User, Users } from 'lucide-react-native';
import { Shadows } from '@/constants/theme';
import { QueryState } from '@/components/common/query-state';
import { useMyTimetable } from '@/features/campus';
import type { TimetableSlot } from '@/types';

type DayCode = TimetableSlot['dayOfWeek'];

const DAYS: { key: DayCode; label: string; name: string }[] = [
  { key: 'MON', label: 'Mon', name: 'Monday' },
  { key: 'TUE', label: 'Tue', name: 'Tuesday' },
  { key: 'WED', label: 'Wed', name: 'Wednesday' },
  { key: 'THU', label: 'Thu', name: 'Thursday' },
  { key: 'FRI', label: 'Fri', name: 'Friday' },
  { key: 'SAT', label: 'Sat', name: 'Saturday' },
];

/** Today's day code in campus time (IST); Monday on Sundays. */
function initialDay(): DayCode {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(new Date()).toUpperCase();
  return DAYS.some((d) => d.key === weekday) ? (weekday as DayCode) : 'MON';
}

interface WeeklyScheduleProps {
  /** 'student' shows the teacher on each slot; 'faculty' shows the section. */
  audience: 'student' | 'faculty';
}

/**
 * The signed-in user's own weekly timetable (GET /timetable/my) with a day picker.
 * Shared by the student Schedule tab and the faculty Timetable tab.
 */
export function WeeklySchedule({ audience }: WeeklyScheduleProps) {
  const timetable = useMyTimetable();
  const [selectedDay, setSelectedDay] = useState<DayCode>(initialDay);
  const dayName = DAYS.find((d) => d.key === selectedDay)?.name;

  return (
    <>
      <View style={styles.daySelector}>
        {DAYS.map((d) => {
          const isSelected = selectedDay === d.key;
          return (
            <TouchableOpacity key={d.key} style={[styles.dayCard, isSelected && styles.activeDayCard]} onPress={() => setSelectedDay(d.key)}>
              <Text style={[styles.dayLabel, isSelected && styles.activeDayText]}>{d.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.slotsList}>
        <QueryState query={timetable}>
          {(slots) => {
            const daySlots = slots.filter((s) => s.dayOfWeek === selectedDay);
            if (daySlots.length === 0) {
              return (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No classes on {dayName}.</Text>
                </View>
              );
            }
            return daySlots.map((slot) => {
              const isLive = slot.status === 'LIVE';
              return (
                <View key={slot.id} style={[styles.slotCard, isLive && styles.liveCard]}>
                  <View style={styles.periodCol}>
                    <Text style={styles.periodNum}>P{slot.period}</Text>
                    <Text style={styles.slotTime}>{slot.time.split(' - ')[0]}</Text>
                    {isLive && (
                      <View style={styles.liveTag}>
                        <Text style={styles.liveTagText}>NOW</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.slotDetails}>
                    <View style={styles.slotTopRow}>
                      <Text style={styles.slotCode}>{slot.subjectCode}</Text>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{slot.isLab ? 'Lab' : 'Lecture'}</Text>
                      </View>
                    </View>
                    <Text style={styles.slotSubject}>{slot.subjectName}</Text>
                    <View style={styles.slotMeta}>
                      <View style={styles.metaRow}>
                        {audience === 'student' ? <User size={12} color="#64748B" /> : <Users size={12} color="#64748B" />}
                        <Text style={styles.metaText}>{audience === 'student' ? slot.facultyName : slot.section}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <MapPin size={12} color="#64748B" />
                        <Text style={styles.metaText}>{slot.roomNumber}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            });
          }}
        </QueryState>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  daySelector: { flexDirection: 'row', gap: 6 },
  dayCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  activeDayCard: { backgroundColor: '#0B3B60', borderColor: '#0B3B60' },
  dayLabel: { fontSize: 12, fontWeight: '800', color: '#636366', textTransform: 'uppercase' },
  activeDayText: { color: '#FFFFFF' },
  slotsList: { gap: 12 },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  liveCard: { borderColor: '#0B6AA8', borderLeftWidth: 4, borderLeftColor: '#0B6AA8', backgroundColor: '#F0F9FF' },
  periodCol: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F2F2F7',
    paddingRight: 8,
  },
  periodNum: { fontSize: 14, fontWeight: '900', color: '#0B3B60' },
  slotTime: { fontSize: 12, color: '#737378', marginTop: 2 },
  liveTag: { backgroundColor: '#0B6AA8', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  liveTagText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  slotDetails: { flex: 1, paddingLeft: 12, gap: 4 },
  slotTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotCode: { fontSize: 12, fontWeight: '800', color: '#0B3B60' },
  typeBadge: { backgroundColor: '#F2F2F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 12, color: '#48484A', fontWeight: '700' },
  slotSubject: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  slotMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#636366' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  emptyText: { fontSize: 12, color: '#636366', fontWeight: '500' },
});
