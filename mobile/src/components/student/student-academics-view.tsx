import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Shadows, Spacing } from '@/constants/theme';
import { CheckCircle2, Clock, Download, UploadCloud } from 'lucide-react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { useAuthStore } from '@/stores/auth-store';
import { QueryState } from '@/components/common/query-state';
import { useAssignments, useGradeCard, useSubmitAssignment } from '@/features/academics';
import { formatDate } from '@/lib/format';

type Tab = 'SUBJECTS' | 'GRADE_CARD' | 'ASSIGNMENTS';

const SUBMITTABLE_TYPES = [
  'application/pdf',
  'image/*',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function StudentAcademicsView() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('SUBJECTS');
  const gradeCard = useGradeCard();
  const assignments = useAssignments();
  const submit = useSubmitAssignment();

  const handleAssignmentSubmit = async (assignmentId: string) => {
    const picked = await DocumentPicker.getDocumentAsync({ type: SUBMITTABLE_TYPES, multiple: false });
    if (picked.canceled || !picked.assets?.[0]) return;
    const file = picked.assets[0];
    submit.mutate(
      { assignmentId, file: { uri: file.uri, name: file.name, mimeType: file.mimeType || 'application/octet-stream' } },
      { onSuccess: () => Alert.alert('Submitted', `"${file.name}" was submitted.`) },
    );
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'SUBJECTS', label: 'Subjects' },
    { key: 'GRADE_CARD', label: 'Grade Card' },
    { key: 'ASSIGNMENTS', label: 'Assignments' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtitle}>VEER MADHO SINGH BHANDARI UTU</Text>
            <Text style={styles.headerTitle}>Academic Record</Text>
            <Text style={styles.headerMeta}>
              {[user?.department, user?.rollNumber ? `Roll ${user.rollNumber}` : null].filter(Boolean).join(' • ')}
            </Text>
          </View>
          <View style={styles.cgpaBadge}>
            <Text style={styles.cgpaLabel}>CGPA</Text>
            <Text style={styles.cgpaValue}>{gradeCard.data?.cgpa.toFixed(2) ?? user?.cgpa?.toFixed(2) ?? '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, activeTab === t.key && styles.activeTabBtn]} onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.tabBtnText, activeTab === t.key && styles.activeTabText]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'SUBJECTS' && (
        <View style={styles.cardsList}>
          <QueryState query={gradeCard} emptyText="No subjects found." isEmpty={(gc) => gc.subjects.length === 0}>
            {(gc) => (
              <>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerText}>Semester {gc.semester} subjects</Text>
                </View>
                {gc.subjects.map((s) => (
                  <View key={s.code} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.courseCode}>{s.code}</Text>
                        <Text style={styles.courseName}>{s.title}</Text>
                      </View>
                      <View style={styles.creditPill}>
                        <Text style={styles.creditText}>{s.credits} Credits</Text>
                      </View>
                    </View>
                    <View style={styles.progressRow}>
                      {s.totalMarks === null || s.maxMarks === null ? (
                        <Text style={styles.progressLabel}>No marks recorded yet</Text>
                      ) : (
                        <>
                          <Text style={styles.progressLabel}>
                            {s.totalMarks}/{s.maxMarks} marks • Grade {s.grade}
                          </Text>
                          <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${(s.totalMarks / s.maxMarks) * 100}%` }]} />
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}
          </QueryState>
        </View>
      )}

      {activeTab === 'GRADE_CARD' && (
        <View style={styles.cardsList}>
          <QueryState query={gradeCard}>
            {(gc) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.semTitle}>Semester {gc.semester}</Text>
                    <Text style={styles.semCredits}>{gc.totalCreditsEarned} credits earned</Text>
                  </View>
                  <View style={styles.sgpaCol}>
                    <Text style={styles.sgpaVal}>{gc.sgpa?.toFixed(2) ?? '—'}</Text>
                    <Text style={styles.sgpaLbl}>SGPA</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.passTag}>
                    <CheckCircle2 size={12} color="#059669" />
                    <Text style={styles.passTagText}>{gc.resultStatus.replace(/_/g, ' ')}</Text>
                  </View>
                  {gc.backlogs > 0 && <Text style={styles.deadlineText}>{gc.backlogs} backlog(s)</Text>}
                </View>
              </View>
            )}
          </QueryState>
        </View>
      )}

      {activeTab === 'ASSIGNMENTS' && (
        <View style={styles.cardsList}>
          <QueryState query={assignments} emptyText="No assignments set for your section.">
            {(list) =>
              list.map((asn) => {
                const submitted = asn.mySubmissionStatus !== null && asn.mySubmissionStatus !== 'PENDING';
                const isUploading = submit.isPending && submit.variables?.assignmentId === asn.id;
                const isOverdue = new Date(asn.deadline) < new Date();
                return (
                  <View key={asn.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.asnSubject}>
                        {asn.subjectCode} • {asn.subjectName}
                      </Text>
                      <View style={[styles.statusPill, submitted ? styles.submittedPill : styles.pendingPill]}>
                        <Text style={[styles.statusPillText, submitted ? styles.submittedText : styles.pendingText]}>
                          {asn.mySubmissionStatus ?? 'PENDING'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.asnTitle}>{asn.title}</Text>
                    {asn.description ? <Text style={styles.asnDescription}>{asn.description}</Text> : null}
                    {asn.myMarks !== null && (
                      <Text style={styles.asnMarks}>
                        Marks: {asn.myMarks} / {asn.maxMarks}
                        {asn.myFeedback ? ` · ${asn.myFeedback}` : ''}
                      </Text>
                    )}
                    {asn.attachmentUrl && (
                      <TouchableOpacity
                        style={styles.briefBtn}
                        onPress={() => openBrowserAsync(asn.attachmentUrl!)}
                        accessibilityRole="link"
                        accessibilityLabel={`Download brief for ${asn.title}`}
                      >
                        <Download size={14} color="#0B3B60" />
                        <Text style={styles.briefBtnText}>Download brief</Text>
                      </TouchableOpacity>
                    )}
                    <View style={styles.cardFooter}>
                      <View style={styles.deadlineRow}>
                        <Clock size={12} color="#64748B" />
                        <Text style={styles.deadlineText}>Due {formatDate(asn.deadline)}</Text>
                      </View>
                      {!submitted && !isOverdue && asn.status !== 'CLOSED' && (
                        <TouchableOpacity style={styles.uploadBtn} onPress={() => handleAssignmentSubmit(asn.id)} disabled={isUploading}>
                          {isUploading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <UploadCloud size={13} color="#FFFFFF" />}
                          <Text style={styles.uploadBtnText}>{isUploading ? 'Uploading…' : 'Submit Work'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            }
          </QueryState>
        </View>
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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,
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
    color: '#636366',
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
    fontSize: 12,
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
    fontSize: 12,
    color: '#0B6AA8',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3B60',
  },
  courseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 2,
  },
  creditPill: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#48484A',
  },
  progressRow: {
    gap: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#636366',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0B6AA8',
    borderRadius: 3,
  },
  semTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  semCredits: {
    fontSize: 12,
    color: '#636366',
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
    fontSize: 12,
    color: '#737378',
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  passTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  passTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F7A45',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3B60',
  },
  asnSubject: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3B60',
  },
  asnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  asnDescription: { fontSize: 13, lineHeight: 18, color: '#3A3A3C', marginTop: 6 },
  asnMarks: { fontSize: 13, lineHeight: 18, color: '#1B6E3A', fontWeight: '600', marginTop: 6 },
  briefBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 12, marginTop: 8, borderRadius: 10, backgroundColor: '#E8EEF5' },
  briefBtnText: { fontSize: 13, fontWeight: '600', color: '#0B3B60' },
  submittedPill: {
    backgroundColor: '#ECFDF5',
  },
  submittedText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '800',
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 12,
    color: '#636366',
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
    fontSize: 12,
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
    borderColor: '#E5E5EA',
  },
  emptyText: {
    fontSize: 12,
    color: '#636366',
    fontWeight: '500',
  },
});
