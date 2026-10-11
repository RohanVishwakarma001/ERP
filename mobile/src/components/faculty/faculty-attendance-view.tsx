import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Shadows, Spacing } from '@/constants/theme';
import { QrCode, CheckCheck, Save } from 'lucide-react-native';
import { QueryState } from '@/components/common/query-state';
import { useRoster, useTodayClasses } from '@/features/faculty';
import { useSubmitRoster, type AttendanceMark } from '@/features/attendance';
import type { FacultyClassItem } from '@/types';

const MARKS: { mark: AttendanceMark; label: string; activeStyle: 'presentActive' | 'absentActive' | 'lateActive' }[] = [
  { mark: 'PRESENT', label: 'P', activeStyle: 'presentActive' },
  { mark: 'ABSENT', label: 'A', activeStyle: 'absentActive' },
  { mark: 'LATE', label: 'L', activeStyle: 'lateActive' },
];

interface FacultyAttendanceViewProps {
  onOpenBroadcaster: (classItem: FacultyClassItem) => void;
}

/** Manual roster attendance for one of today's classes (POST /attendance/batch). */
export function FacultyAttendanceView({ onOpenBroadcaster }: FacultyAttendanceViewProps) {
  const classes = useTodayClasses();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Only explicit changes are stored; everyone else defaults to PRESENT.
  const [marks, setMarks] = useState<Record<string, AttendanceMark>>({});
  const submitRoster = useSubmitRoster();

  const list = classes.data ?? [];
  const selected = list.find((c) => c.id === selectedId) ?? list.find((c) => c.status === 'LIVE') ?? list[0];
  const roster = useRoster(selected?.section);
  const students = roster.data ?? [];
  const markOf = (studentId: string): AttendanceMark => marks[studentId] ?? 'PRESENT';

  const count = (mark: AttendanceMark) => students.filter((s) => markOf(s.id) === mark).length;

  const selectClass = (id: string) => {
    setSelectedId(id);
    setMarks({});
  };

  const submit = () => {
    if (!selected) return;
    Alert.alert(
      'Submit attendance',
      `${selected.subjectCode} • ${selected.section} • Period ${selected.period}\nPresent ${count('PRESENT')}, Absent ${count('ABSENT')}, Late ${count('LATE')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () =>
            submitRoster.mutate(
              {
                period: { subjectCode: selected.subjectCode, section: selected.section, period: selected.period },
                records: students.map((s) => ({ studentId: s.id, status: markOf(s.id) })),
              },
              { onSuccess: (res) => Alert.alert('Saved', res.message) },
            ),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.selectorsCard}>
        <Text style={styles.selectorLabel}>TODAY&apos;S CLASSES</Text>
        <QueryState query={classes} emptyText="You have no classes today.">
          {(items) => (
            <View style={styles.pillGroup}>
              {items.map((c) => (
                <TouchableOpacity key={c.id} style={[styles.pill, selected?.id === c.id && styles.activePill]} onPress={() => selectClass(c.id)}>
                  <Text style={[styles.pillText, selected?.id === c.id && styles.activePillText]}>
                    P{c.period} {c.subjectCode} {c.section}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </QueryState>

        {selected && (
          <TouchableOpacity style={styles.qrBroadcasterBtn} onPress={() => onOpenBroadcaster(selected)} activeOpacity={0.8}>
            <QrCode size={18} color="#FFFFFF" />
            <Text style={styles.qrBroadcasterBtnText}>Broadcast QR for {selected.section}</Text>
          </TouchableOpacity>
        )}
      </View>

      {selected && (
        <>
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{count('PRESENT')}</Text>
              <Text style={[styles.statLabel, { color: '#1F7A45' }]}>Present</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{count('ABSENT')}</Text>
              <Text style={[styles.statLabel, { color: '#C62828' }]}>Absent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{count('LATE')}</Text>
              <Text style={[styles.statLabel, { color: '#9A5B05' }]}>Late</Text>
            </View>
            <TouchableOpacity style={styles.markAllBtn} onPress={() => setMarks({})}>
              <CheckCheck size={14} color="#0B3B60" />
              <Text style={styles.markAllBtnText}>All Present</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rosterList}>
            <QueryState query={roster} emptyText={`No students enrolled in ${selected.section}.`}>
              {(list) =>
                list.map((student) => (
                  <View key={student.id} style={styles.studentCard}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentRoll}>{student.rollNumber}</Text>
                      <Text style={styles.studentName}>{student.name}</Text>
                    </View>
                    <View style={styles.togglesRow} accessibilityRole="radiogroup">
                      {MARKS.map(({ mark, label, activeStyle }) => {
                        const active = markOf(student.id) === mark;
                        return (
                          <TouchableOpacity
                            key={mark}
                            style={[styles.toggleBtn, active && styles[activeStyle]]}
                            onPress={() => setMarks((prev) => ({ ...prev, [student.id]: mark }))}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: active }}
                            accessibilityLabel={`Mark ${student.name} ${mark.toLowerCase()}`}
                          >
                            <Text style={[styles.toggleBtnText, active && styles.activeToggleText]}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))
              }
            </QueryState>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitRoster.isPending && { opacity: 0.7 }]}
            onPress={submit}
            disabled={submitRoster.isPending || students.length === 0}
          >
            {submitRoster.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit Attendance</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 32,
    gap: Spacing.lg,
  },
  selectorsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
    ...Shadows.sm,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#636366',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activePill: {
    backgroundColor: '#0B3B60',
    borderColor: '#0B3B60',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#48484A',
  },
  activePillText: {
    color: '#FFFFFF',
  },
  qrBroadcasterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#002541',
    paddingVertical: 12,
    borderRadius: 10,
  },
  qrBroadcasterBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Shadows.sm,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5EA',
  },
  markAllBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  markAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3B60',
  },
  rosterList: {
    gap: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  studentInfo: {
    flex: 1,
  },
  studentRoll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3B60',
    fontFamily: 'monospace',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 1,
  },
  togglesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#636366',
  },
  presentActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  absentActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  lateActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B3B60',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
    ...Shadows.md,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
