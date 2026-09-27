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
  BookOpen,
  Award,
  Download,
  Calendar,
  FileCheck,
  CheckCircle2,
  Clock,
  UploadCloud,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { mobileStudentService } from '@/services/mobile-services';

export function StudentAcademicsView() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'GRADE_CARD' | 'ASSIGNMENTS'>('SUBJECTS');
  const [gradeCard, setGradeCard] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAcademicData() {
      try {
        const [gc, asns] = await Promise.allSettled([
          mobileStudentService.getGradeCard(),
          mobileStudentService.getAssignments(),
        ]);
        if (isMounted) {
          if (gc.status === 'fulfilled') setGradeCard(gc.value);
          if (asns.status === 'fulfilled') setAssignments(Array.isArray(asns.value) ? asns.value : []);
        }
      } catch (err) {
        console.error('Failed to load academic data', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadAcademicData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAssignmentSubmit = async (assignmentId: string) => {
    try {
      await mobileStudentService.submitAssignment(
        assignmentId,
        'https://storage.jbitdoon.edu.in/submissions/assignment-pdf.pdf'
      );
      Alert.alert('Success', 'Assignment submitted and registered with academic department.');
      const updated = await mobileStudentService.getAssignments();
      setAssignments(Array.isArray(updated) ? updated : []);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit assignment.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Academic Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>VEER MADHO SINGH BHANDARI UTU</Text>
            <Text style={styles.headerTitle}>Academic Registry</Text>
            <Text style={styles.headerMeta}>
              B.Tech Computer Science • Roll: {user?.rollNumber || '220102048'}
            </Text>
          </View>
          <View style={styles.cgpaBadge}>
            <Text style={styles.cgpaLabel}>CGPA</Text>
            <Text style={styles.cgpaValue}>{user?.cgpa || 8.92}</Text>
          </View>
        </View>
      </View>

      {/* 2. Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'SUBJECTS' && styles.activeTabBtn]}
          onPress={() => setActiveTab('SUBJECTS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'SUBJECTS' && styles.activeTabText]}>
            Curriculum
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'GRADE_CARD' && styles.activeTabBtn]}
          onPress={() => setActiveTab('GRADE_CARD')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'GRADE_CARD' && styles.activeTabText]}>
            Grade Cards
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ASSIGNMENTS' && styles.activeTabBtn]}
          onPress={() => setActiveTab('ASSIGNMENTS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'ASSIGNMENTS' && styles.activeTabText]}>
            Assignments
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Tab Content */}
      {activeTab === 'SUBJECTS' && (
        <View style={styles.cardsList}>
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Semester {user?.semester || 6} Registered Courses (UTU Model Curriculum)
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#0B3B60" style={{ marginVertical: 20 }} />
          ) : !gradeCard?.subjects || gradeCard.subjects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No registered course subjects found.</Text>
            </View>
          ) : (
            gradeCard.subjects.map((item: any) => (
              <View key={item.code} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.courseCode}>{item.code}</Text>
                    <Text style={styles.courseName}>{item.title || item.name}</Text>
                  </View>
                  <View style={styles.creditPill}>
                    <Text style={styles.creditText}>{item.credits} Credits</Text>
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Grade Points: {item.gradePoints ?? item.gradePoint ?? 9}/10</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(item.gradePoints || item.gradePoint || 9) * 10}%` }]} />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === 'GRADE_CARD' && (
        <View style={styles.cardsList}>
          <View style={styles.digilockerBanner}>
            <View style={styles.digilockerIcon}>
              <FileCheck size={20} color="#0B3B60" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.digilockerTitle}>National Academic Depository (NAD)</Text>
              <Text style={styles.digilockerSub}>
                DigiLocker Verified Blockchain Credentials Linked
              </Text>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#0B3B60" style={{ marginVertical: 20 }} />
          ) : !gradeCard ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No published grade cards available for this student.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.semTitle}>Semester {gradeCard.semester} (Academic Year {gradeCard.academicYear || '2025-2026'})</Text>
                  <Text style={styles.semCredits}>{gradeCard.totalCreditsEarned || 24} Credits Earned</Text>
                </View>
                <View style={styles.sgpaCol}>
                  <Text style={styles.sgpaVal}>{gradeCard.sgpa || gradeCard.cgpa || 8.92}</Text>
                  <Text style={styles.sgpaLbl}>SGPA</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.passTag}>
                  <CheckCircle2 size={12} color="#059669" />
                  <Text style={styles.passTagText}>{gradeCard.resultStatus || 'PASSED'}</Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => Alert.alert('DigiLocker Verified', `Digital Hash:\n${gradeCard.digitalVerificationHash || '0x88f2a991c0b749d2e1329a43fe7d8902'}`)}
                >
                  <Download size={13} color="#0B3B60" />
                  <Text style={styles.downloadBtnText}>Transcript PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {activeTab === 'ASSIGNMENTS' && (
        <View style={styles.cardsList}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#0B3B60" style={{ marginVertical: 20 }} />
          ) : assignments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No pending or submitted assignments.</Text>
            </View>
          ) : (
            assignments.map((asn) => (
              <View key={asn.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.asnSubject}>{asn.subject?.name || asn.subject || 'Academic Coursework'}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      asn.status === 'SUBMITTED' ? styles.submittedPill : styles.pendingPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        asn.status === 'SUBMITTED' ? styles.submittedText : styles.pendingText,
                      ]}
                    >
                      {asn.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.asnTitle}>{asn.title}</Text>

                <View style={styles.cardFooter}>
                  <View style={styles.deadlineRow}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.deadlineText}>
                      Due: {asn.deadline ? new Date(asn.deadline).toLocaleDateString() : 'Active'}
                    </Text>
                  </View>

                  {asn.status !== 'SUBMITTED' && (
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => handleAssignmentSubmit(asn.id)}
                    >
                      <UploadCloud size={13} color="#FFFFFF" />
                      <Text style={styles.uploadBtnText}>Submit Work</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerMeta: {
    fontSize: 11,
    color: '#BAE6FD',
    marginTop: 2,
  },
  cgpaBadge: {
    backgroundColor: '#0B3B60',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  cgpaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93C5FD',
  },
  cgpaValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#0B3B60',
    fontWeight: '800',
  },
  cardsList: {
    gap: 12,
  },
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBannerText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  digilockerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  digilockerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digilockerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B3B60',
  },
  digilockerSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B3B60',
  },
  courseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  creditPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creditText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  progressRow: {
    gap: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
  semTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  semCredits: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sgpaCol: {
    alignItems: 'flex-end',
  },
  sgpaVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B3B60',
  },
  sgpaLbl: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  passTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  passTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  downloadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3B60',
  },
  asnSubject: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3B60',
  },
  asnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
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
  submittedPill: {
    backgroundColor: '#ECFDF5',
  },
  submittedText: {
    color: '#065F46',
    fontSize: 9,
    fontWeight: '800',
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '800',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 11,
    color: '#64748B',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B3B60',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
