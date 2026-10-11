import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Shadows, Spacing } from '@/constants/theme';
import { Save } from 'lucide-react-native';
import { QueryState } from '@/components/common/query-state';
import { useRecordMarks, useRoster, useWorkload, type AssessmentType } from '@/features/faculty';

const ASSESSMENTS: { key: AssessmentType; label: string; maxMarks: number }[] = [
  { key: 'INTERNAL_CIA_1', label: 'CIA 1', maxMarks: 30 },
  { key: 'INTERNAL_CIA_2', label: 'CIA 2', maxMarks: 30 },
  { key: 'PRACTICAL', label: 'Practical', maxMarks: 50 },
];

/** Enter one assessment's marks for one of the faculty member's own classes (POST /exams/marks). */
export function FacultyMarksView() {
  const workload = useWorkload();
  const recordMarks = useRecordMarks();
  const [classKey, setClassKey] = useState<string | null>(null);
  const [assessment, setAssessment] = useState(ASSESSMENTS[0]);
  // Raw text per student; blank means "not entered" and is not submitted.
  const [entries, setEntries] = useState<Record<string, string>>({});

  const myClasses = useMemo(() => {
    const unique = new Map<string, { code: string; name: string; section: string }>();
    for (const c of workload.data?.assignedClasses ?? []) unique.set(`${c.code}|${c.section}`, c);
    return [...unique.entries()].map(([key, c]) => ({ key, ...c }));
  }, [workload.data]);
  const selected = myClasses.find((c) => c.key === classKey) ?? myClasses[0];
  const roster = useRoster(selected?.section);

  const reset = (next: () => void) => {
    next();
    setEntries({});
  };

  const save = () => {
    if (!selected) return;
    const records: { studentId: string; marksObtained: number }[] = [];
    for (const [studentId, raw] of Object.entries(entries)) {
      if (raw.trim() === '') continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > assessment.maxMarks) {
        Alert.alert('Invalid marks', `Marks must be between 0 and ${assessment.maxMarks}.`);
        return;
      }
      records.push({ studentId, marksObtained: value });
    }
    if (records.length === 0) {
      Alert.alert('Nothing to save', 'Enter marks for at least one student.');
      return;
    }
    const missing = (roster.data?.length ?? 0) - records.length;
    const doSave = () =>
      recordMarks.mutate(
        { subjectCode: selected.code, section: selected.section, assessmentType: assessment.key, maxMarks: assessment.maxMarks, records },
        { onSuccess: (res) => Alert.alert('Marks saved', res.message) },
      );
    if (missing > 0) {
      Alert.alert('Some marks are blank', `${missing} student(s) have no marks entered and will be skipped.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save anyway', onPress: doSave },
      ]);
    } else {
      doSave();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.headerSubtitle}>CONTINUOUS ASSESSMENT</Text>
        <Text style={styles.headerTitle}>Marks Entry</Text>
        <Text style={styles.headerMeta}>
          {selected ? `${selected.code} ${selected.name} • ${selected.section}` : workload.isPending ? 'Loading your classes…' : 'No classes assigned'}
        </Text>

        {myClasses.length > 1 && (
          <View style={styles.examTabs}>
            {myClasses.map((c) => (
              <TouchableOpacity key={c.key} style={[styles.examTab, selected?.key === c.key && styles.activeExamTab]} onPress={() => reset(() => setClassKey(c.key))}>
                <Text style={[styles.examTabText, selected?.key === c.key && styles.activeExamTabText]}>
                  {c.code} {c.section}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.examTabs}>
          {ASSESSMENTS.map((a) => (
            <TouchableOpacity key={a.key} style={[styles.examTab, assessment.key === a.key && styles.activeExamTab]} onPress={() => reset(() => setAssessment(a))}>
              <Text style={[styles.examTabText, assessment.key === a.key && styles.activeExamTabText]}>
                {a.label} ({a.maxMarks})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selected && (
        <View style={styles.marksList}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>STUDENT</Text>
            <Text style={[styles.tableColHeader, { width: 90, textAlign: 'center' }]}>MARKS / {assessment.maxMarks}</Text>
          </View>
          <QueryState query={roster} emptyText={`No students enrolled in ${selected.section}.`}>
            {(students) =>
              students.map((s) => (
                <View key={s.id} style={styles.markRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentRoll}>{s.rollNumber}</Text>
                    <Text style={styles.studentName}>{s.name}</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.markInput}
                      keyboardType="numeric"
                      placeholder="—"
                      value={entries[s.id] ?? ''}
                      onChangeText={(val) => setEntries((prev) => ({ ...prev, [s.id]: val.replace(/[^0-9.]/g, '') }))}
                      maxLength={5}
                      accessibilityLabel={`Marks for ${s.name}`}
                    />
                    <Text style={styles.maxText}>/ {assessment.maxMarks}</Text>
                  </View>
                </View>
              ))
            }
          </QueryState>
        </View>
      )}

      <TouchableOpacity style={[styles.saveBtn, recordMarks.isPending && { opacity: 0.7 }]} onPress={save} disabled={recordMarks.isPending || !selected}>
        {recordMarks.isPending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Save size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Marks</Text>
          </>
        )}
      </TouchableOpacity>
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
  headerCard: {
    backgroundColor: '#002541',
    borderRadius: 20,
    padding: Spacing.xl,
    ...Shadows.md,
    gap: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerMeta: {
    fontSize: 12,
    color: '#BAE6FD',
  },
  examTabs: {
    flexDirection: 'row',
    backgroundColor: '#0B3B60',
    borderRadius: 10,
    padding: 3,
    marginTop: 14,
  },
  examTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeExamTab: {
    backgroundColor: '#FFFFFF',
  },
  examTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
  },
  activeExamTabText: {
    color: '#0B3B60',
    fontWeight: '800',
  },
  marksList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tableColHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#636366',
    letterSpacing: 0.5,
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  studentRoll: {
    fontSize: 12,
    color: '#0B3B60',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markInput: {
    width: 44,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    backgroundColor: '#F2F2F7',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  maxText: {
    fontSize: 12,
    color: '#737378',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B3B60',
    paddingVertical: 14,
    borderRadius: 12,
    ...Shadows.sm,
  },
  saveBtnText: {
    fontSize: 13,
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
