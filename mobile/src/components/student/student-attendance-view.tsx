import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Shadows, Spacing } from '@/constants/theme';
import { QrCode, AlertTriangle, CheckCircle2, FileText } from 'lucide-react-native';
import { QueryState } from '@/components/common/query-state';
import { ATTENDANCE_THRESHOLD, useAttendanceSummary, useMyPetitions } from '@/features/attendance';
import { formatDate } from '@/lib/format';

type Tab = 'OVERVIEW' | 'SUBJECTS' | 'PETITIONS';

interface StudentAttendanceViewProps {
  onOpenQrScanner: () => void;
}

export function StudentAttendanceView({ onOpenQrScanner }: StudentAttendanceViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  const summary = useAttendanceSummary();
  const petitions = useMyPetitions();

  const overallPct = summary.data?.overallPercentage ?? 0;
  const threshold = summary.data?.statutoryThreshold ?? ATTENDANCE_THRESHOLD;
  const hasClasses = (summary.data?.totalClasses ?? 0) > 0;
  const isSafe = !hasClasses || overallPct >= threshold;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'OVERVIEW', label: 'Overview' },
    { key: 'SUBJECTS', label: 'Subjects' },
    { key: 'PETITIONS', label: 'Petitions' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.macroBanner}>
        <View style={styles.macroHeader}>
          <View>
            <Text style={styles.macroLabel}>UTU STATUTORY ATTENDANCE</Text>
            <Text style={styles.macroPercentage}>{summary.data ? `${overallPct.toFixed(1)}%` : '—'}</Text>
            <Text style={styles.macroSub}>
              {!hasClasses
                ? 'No classes recorded yet'
                : isSafe
                  ? 'Eligible for end-semester examinations'
                  : `Debarment risk • minimum ${threshold}% required`}
            </Text>
          </View>
          {hasClasses && (
            <View style={[styles.safeBadge, !isSafe && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444' }]}>
              {isSafe ? <CheckCircle2 size={16} color="#34D399" /> : <AlertTriangle size={16} color="#EF4444" />}
              <Text style={[styles.safeBadgeText, !isSafe && { color: '#C62828' }]}>
                {isSafe ? `Safe ≥${threshold}%` : `Below ${threshold}%`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.macroProgressContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, overallPct))}%` }, !isSafe && { backgroundColor: '#EF4444' }]}
            />
            <View style={styles.thresholdMarker}>
              <View style={styles.thresholdLine} />
              <Text style={styles.thresholdText}>{threshold}% Min</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.qrScanBannerBtn} onPress={onOpenQrScanner} activeOpacity={0.8}>
          <QrCode size={18} color="#002541" />
          <Text style={styles.qrScanBannerText}>Scan Classroom QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, activeTab === t.key && styles.activeTabBtn]} onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.tabBtnText, activeTab === t.key && styles.activeTabText]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab !== 'PETITIONS' ? (
        <View style={styles.subjectList}>
          <QueryState query={summary} emptyText="No attendance recorded yet." isEmpty={(s) => s.subjects.length === 0}>
            {(s) =>
              s.subjects.map((sub) => {
                const atRisk = sub.status !== 'NORMAL';
                return (
                  <View key={sub.code} style={[styles.subjectCard, atRisk && styles.warningSubjectCard]}>
                    <View style={styles.subjectHeader}>
                      <View style={styles.subCodeGroup}>
                        <Text style={styles.subCode}>{sub.code}</Text>
                        <Text style={styles.subName}>{sub.name}</Text>
                      </View>
                      <View style={styles.subPercentageCol}>
                        <Text style={[styles.subPercentage, atRisk ? styles.warningText : styles.safeText]}>{sub.percentage}%</Text>
                        <Text style={styles.subCount}>
                          {sub.attended}/{sub.total} classes
                        </Text>
                      </View>
                    </View>
                    <View style={styles.subProgressTrack}>
                      <View
                        style={[
                          styles.subProgressFill,
                          { width: `${Math.min(sub.percentage, 100)}%`, backgroundColor: atRisk ? '#F59E0B' : '#10B981' },
                        ]}
                      />
                    </View>
                    <View style={styles.subFooter}>
                      <Text style={styles.facultyName}>{sub.faculty}</Text>
                      {atRisk ? (
                        <View style={styles.warningPill}>
                          <AlertTriangle size={11} color="#B45309" />
                          <Text style={styles.warningPillText}>
                            Attend {sub.neededFor75} more to reach {threshold}%
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.safeStatusText}>Compliant</Text>
                      )}
                    </View>
                  </View>
                );
              })
            }
          </QueryState>
        </View>
      ) : (
        <View style={styles.petitionsContainer}>
          <QueryState query={petitions} emptyText="You haven't filed any petitions.">
            {(list) =>
              list.map((p) => (
                <View key={p.id} style={styles.petitionCard}>
                  <View style={styles.petitionHeader}>
                    <Text style={styles.petitionSubject}>
                      {p.subjectCode} {p.subjectName}
                    </Text>
                    <View style={styles.approvedPill}>
                      <Text style={styles.approvedText}>{p.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.petitionDetails}>
                    {formatDate(p.date)} • Period {p.period}
                  </Text>
                  <Text style={styles.petitionReviewer}>{p.reason}</Text>
                </View>
              ))
            }
          </QueryState>
          <TouchableOpacity
            style={styles.newPetitionBtn}
            onPress={() =>
              Alert.alert('File a petition', 'Attendance petitions can be filed from the Attendance page of the student web portal.')
            }
          >
            <FileText size={16} color="#FFFFFF" />
            <Text style={styles.newPetitionBtnText}>How to file a petition</Text>
          </TouchableOpacity>
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
  macroBanner: {
    backgroundColor: '#002541',
    borderRadius: 20,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  macroPercentage: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  macroSub: {
    fontSize: 12,
    color: '#BAE6FD',
    marginTop: 2,
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  safeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  macroProgressContainer: {
    marginTop: 18,
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 5,
    position: 'relative',
    overflow: 'visible',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  thresholdMarker: {
    position: 'absolute',
    left: '75%',
    top: -4,
    alignItems: 'center',
  },
  thresholdLine: {
    width: 2,
    height: 18,
    backgroundColor: '#FBBF24',
  },
  thresholdText: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '800',
    marginTop: 2,
  },
  qrScanBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    ...Shadows.sm,
  },
  qrScanBannerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#002541',
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
  subjectList: {
    gap: 12,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
    ...Shadows.sm,
  },
  warningSubjectCard: {
    borderColor: '#FCD34D',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subCodeGroup: {
    flex: 1,
  },
  subCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3B60',
  },
  subName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 2,
  },
  subPercentageCol: {
    alignItems: 'flex-end',
  },
  subPercentage: {
    fontSize: 16,
    fontWeight: '900',
  },
  safeText: {
    color: '#1F7A45',
  },
  warningText: {
    color: '#9A5B05',
  },
  subCount: {
    fontSize: 12,
    color: '#737378',
    marginTop: 2,
  },
  subProgressTrack: {
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  subProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  facultyName: {
    fontSize: 12,
    color: '#636366',
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  safeStatusText: {
    fontSize: 12,
    color: '#1F7A45',
    fontWeight: '600',
  },
  petitionsContainer: {
    gap: 12,
  },
  petitionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  petitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petitionSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  approvedPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  petitionDetails: {
    fontSize: 12,
    color: '#636366',
  },
  petitionReviewer: {
    fontSize: 12,
    color: '#737378',
  },
  newPetitionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B3B60',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  newPetitionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
