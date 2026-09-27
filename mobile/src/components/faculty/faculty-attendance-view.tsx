import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import {
  QrCode,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Save,
  CheckCheck,
} from 'lucide-react-native';
import { mobileFacultyService } from '@/services/mobile-services';

interface StudentRosterItem {
  id: string;
  roll: string;
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

interface FacultyAttendanceViewProps {
  onOpenBroadcaster: () => void;
}

export function FacultyAttendanceView({ onOpenBroadcaster }: FacultyAttendanceViewProps) {
  const [selectedClass, setSelectedClass] = useState('CSE-8B');
  const [selectedPeriod, setSelectedPeriod] = useState(2);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRoster() {
      setIsLoading(true);
      try {
        const students = await mobileFacultyService.getRosterStudents({ section: selectedClass });
        if (isMounted) {
          if (Array.isArray(students) && students.length > 0) {
            setRoster(
              students.map((s: any, idx: number) => ({
                id: s.id,
                roll: s.rollNumber || `22010200${idx + 1}`,
                name: s.user?.name || s.name || `Student ${idx + 1}`,
                status: 'PRESENT',
              }))
            );
          } else {
            setRoster([]);
          }
        }
      } catch (err) {
        console.error('Failed to load roster students', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadRoster();
    return () => {
      isMounted = false;
    };
  }, [selectedClass]);

  const setStatus = (id: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setRoster((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((item) => ({ ...item, status: 'PRESENT' })));
  };

  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const lateCount = roster.filter((r) => r.status === 'LATE').length;

  const handleSubmitRoster = async () => {
    Alert.alert(
      'Submit Attendance',
      `Confirm attendance register for ${selectedClass} (Period ${selectedPeriod})?\nPresent: ${presentCount}, Absent: ${absentCount}, Late: ${lateCount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock & Submit',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await mobileFacultyService.submitRosterAttendance(
                `class-${selectedClass}-${selectedPeriod}`,
                roster.map((r) => ({
                  studentId: r.id,
                  status: r.status,
                }))
              );
              Alert.alert('Success', 'Attendance locked and submitted to UTU Academic Ledger.');
            } catch (err: any) {
              console.error('Failed to submit roster attendance', err);
              Alert.alert(
                'Submission Failed',
                err?.response?.data?.message || 'Could not save attendance. Please check your connection and try again.'
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Selector Bar */}
      <View style={styles.selectorsCard}>
        <View style={styles.selectorRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectorLabel}>ACTIVE SECTION</Text>
            <View style={styles.pillGroup}>
              {['CSE-8B', 'CSE-6A', 'CSE-4A'].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={[styles.pill, selectedClass === sec && styles.activePill]}
                  onPress={() => setSelectedClass(sec)}
                >
                  <Text style={[styles.pillText, selectedClass === sec && styles.activePillText]}>
                    {sec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ width: 110 }}>
            <Text style={styles.selectorLabel}>PERIOD</Text>
            <View style={styles.pillGroup}>
              {[1, 2, 4].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.pill, selectedPeriod === p && styles.activePill]}
                  onPress={() => setSelectedPeriod(p)}
                >
                  <Text style={[styles.pillText, selectedPeriod === p && styles.activePillText]}>
                    P{p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Dynamic QR Broadcaster Action */}
        <TouchableOpacity
          style={styles.qrBroadcasterBtn}
          onPress={onOpenBroadcaster}
          activeOpacity={0.8}
        >
          <QrCode size={18} color="#FFFFFF" />
          <Text style={styles.qrBroadcasterBtnText}>Broadcast Dynamic QR for {selectedClass}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Roster Statistics & Bulk Control */}
      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{presentCount}</Text>
          <Text style={[styles.statLabel, { color: '#059669' }]}>Present</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{absentCount}</Text>
          <Text style={[styles.statLabel, { color: '#DC2626' }]}>Absent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{lateCount}</Text>
          <Text style={[styles.statLabel, { color: '#D97706' }]}>Late</Text>
        </View>

        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllPresent}>
          <CheckCheck size={14} color="#0B3B60" />
          <Text style={styles.markAllBtnText}>All Present</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Student Roster Roster */}
      <View style={styles.rosterList}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0B3B60" style={{ marginVertical: 24 }} />
        ) : roster.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No students enrolled in {selectedClass}.</Text>
          </View>
        ) : (
          roster.map((student) => (
            <View key={student.id} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentRoll}>{student.roll}</Text>
                <Text style={styles.studentName}>{student.name}</Text>
              </View>

              <View style={styles.togglesRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    student.status === 'PRESENT' && styles.presentActive,
                  ]}
                  onPress={() => setStatus(student.id, 'PRESENT')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      student.status === 'PRESENT' && styles.activeToggleText,
                    ]}
                  >
                    P
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    student.status === 'ABSENT' && styles.absentActive,
                  ]}
                  onPress={() => setStatus(student.id, 'ABSENT')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      student.status === 'ABSENT' && styles.activeToggleText,
                    ]}
                  >
                    A
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    student.status === 'LATE' && styles.lateActive,
                  ]}
                  onPress={() => setStatus(student.id, 'LATE')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      student.status === 'LATE' && styles.activeToggleText,
                    ]}
                  >
                    L
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 4. Submit Register Button */}
      <TouchableOpacity
        style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
        onPress={handleSubmitRoster}
        disabled={isSubmitting || roster.length === 0}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>Save &amp; Submit Attendance Roster</Text>
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
  selectorsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...Shadows.sm,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePill: {
    backgroundColor: '#0B3B60',
    borderColor: '#0B3B60',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
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
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
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
    fontSize: 11,
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
    borderColor: '#E2E8F0',
  },
  studentInfo: {
    flex: 1,
  },
  studentRoll: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B3B60',
    fontFamily: 'monospace',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  togglesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
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
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
