import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import { Award, Save, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { mobileFacultyService } from '@/services/mobile-services';

interface StudentMarkItem {
  id: string;
  roll: string;
  name: string;
  marks: string;
  maxMarks: number;
}

export function FacultyMarksView() {
  const [selectedExam, setSelectedExam] = useState<'CIA_1' | 'CIA_2' | 'PRACTICAL'>('CIA_1');
  const [marksData, setMarksData] = useState<StudentMarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStudents() {
      setIsLoading(true);
      try {
        const students = await mobileFacultyService.getRosterStudents();
        if (isMounted) {
          if (Array.isArray(students) && students.length > 0) {
            setMarksData(
              students.map((s: any, idx: number) => ({
                id: s.id,
                roll: s.rollNumber || `22010200${idx + 1}`,
                name: s.user?.name || s.name || `Student ${idx + 1}`,
                marks: '24',
                maxMarks: selectedExam === 'PRACTICAL' ? 50 : 30,
              }))
            );
          } else {
            setMarksData([]);
          }
        }
      } catch (err) {
        console.error('Failed to load roster students', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadStudents();
    return () => {
      isMounted = false;
    };
  }, [selectedExam]);

  const handleMarkChange = (id: string, val: string) => {
    setMarksData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, marks: val } : item))
    );
  };

  const handleSaveMarks = async () => {
    setIsSubmitting(true);
    try {
      await mobileFacultyService.submitExamMarks({
        examType: selectedExam,
        subjectCode: 'CS-801',
        records: marksData.map((m) => ({
          studentId: m.id,
          marksObtained: Number(m.marks) || 0,
          maxMarks: m.maxMarks,
        })),
      });
      Alert.alert('Marks Saved', 'Evaluation ledger saved and forwarded to COE Controller.');
    } catch (err: any) {
      console.error('Failed to submit exam marks', err);
      Alert.alert(
        'Save Failed',
        err?.response?.data?.message || 'Could not save marks. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.headerSubtitle}>UTU CONTINUOUS ASSESSMENT</Text>
        <Text style={styles.headerTitle}>Mark Evaluation Portal</Text>
        <Text style={styles.headerMeta}>CS-801 Distributed Systems • CSE-8B (54 Students)</Text>

        <View style={styles.examTabs}>
          {[
            { key: 'CIA_1', label: 'Mid-Sem CIA 1 (30)' },
            { key: 'CIA_2', label: 'Mid-Sem CIA 2 (30)' },
            { key: 'PRACTICAL', label: 'Practical Lab (50)' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.examTab, selectedExam === tab.key && styles.activeExamTab]}
              onPress={() => setSelectedExam(tab.key as any)}
            >
              <Text style={[styles.examTabText, selectedExam === tab.key && styles.activeExamTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. Marks Entry Table */}
      <View style={styles.marksList}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableColHeader, { flex: 1 }]}>STUDENT</Text>
          <Text style={[styles.tableColHeader, { width: 90, textAlign: 'center' }]}>
            MARKS / 30
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#0B3B60" style={{ marginVertical: 24 }} />
        ) : marksData.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No registered students found for evaluation.</Text>
          </View>
        ) : (
          marksData.map((item) => (
            <View key={item.id} style={styles.markRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentRoll}>{item.roll}</Text>
                <Text style={styles.studentName}>{item.name}</Text>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.markInput}
                  keyboardType="numeric"
                  value={item.marks}
                  onChangeText={(val) => handleMarkChange(item.id, val)}
                  maxLength={2}
                />
                <Text style={styles.maxText}>/ {item.maxMarks}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 3. Action */}
      <TouchableOpacity
        style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
        onPress={handleSaveMarks}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Save size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save &amp; Forward to Exam Controller</Text>
          </>
        )}
      </TouchableOpacity>
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
  headerCard: {
    backgroundColor: '#002541',
    borderRadius: 20,
    padding: Spacing.xl,
    ...Shadows.md,
    gap: 4,
  },
  headerSubtitle: {
    fontSize: 10,
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
    fontSize: 11,
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
    fontSize: 10,
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
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableColHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentRoll: {
    fontSize: 10,
    color: '#0B3B60',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
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
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  maxText: {
    fontSize: 11,
    color: '#94A3B8',
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
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
