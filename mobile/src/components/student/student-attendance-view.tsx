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
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  FileText,
} from 'lucide-react-native';
import { mobileStudentService } from '@/services/mobile-services';
import { AttendanceSubjectItem } from '@/types';

interface StudentAttendanceViewProps {
  onOpenQrScanner: () => void;
}

export function StudentAttendanceView({ onOpenQrScanner }: StudentAttendanceViewProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUBJECTS' | 'PETITIONS'>('OVERVIEW');
  const [attendanceData, setAttendanceData] = useState<{
    overallPercentage: number;
    statutoryThreshold: number;
    isDebarred: boolean;
    subjects: AttendanceSubjectItem[];
  }>({
    overallPercentage: 0,
    statutoryThreshold: 75,
    isDebarred: false,
    subjects: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAttendance() {
      try {
        const data = await mobileStudentService.getAttendanceSummary();
        if (isMounted && data) {
          setAttendanceData({
            overallPercentage: typeof data.overallPercentage === 'number' ? data.overallPercentage : 0,
            statutoryThreshold: data.statutoryThreshold || 75,
            isDebarred: Boolean(data.isDebarred),
            subjects: Array.isArray(data.subjects) ? data.subjects : [],
          });
        }
      } catch (err) {
        console.error('Failed to load student attendance', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadAttendance();
    return () => {
      isMounted = false;
    };
  }, []);

  const overallPct = attendanceData.overallPercentage;
  const isSafe = overallPct >= attendanceData.statutoryThreshold;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Macro Circular/Gauge Attendance Banner */}
      <View style={styles.macroBanner}>
        <View style={styles.macroHeader}>
          <View>
            <Text style={styles.macroLabel}>UTU STATUTORY ATTENDANCE</Text>
            <Text style={styles.macroPercentage}>{overallPct.toFixed(1)}%</Text>
            <Text style={styles.macroSub}>
              {isSafe
                ? 'Eligible for End-Semester Examinations'
                : 'Debarment Risk • Minimum 75% Attendance Required'}
            </Text>
          </View>
          <View
            style={[
              styles.safeBadge,
              !isSafe && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444' },
            ]}
          >
            {isSafe ? (
              <CheckCircle2 size={16} color="#34D399" />
            ) : (
              <AlertTriangle size={16} color="#EF4444" />
            )}
            <Text style={[styles.safeBadgeText, !isSafe && { color: '#EF4444' }]}>
              {isSafe ? `Safe >${attendanceData.statutoryThreshold}%` : 'Critical <75%'}
            </Text>
          </View>
        </View>

        {/* Progress Bar with 75% Marker */}
        <View style={styles.macroProgressContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, overallPct))}%` },
                !isSafe && { backgroundColor: '#EF4444' },
              ]}
            />
            {/* 75% Marker */}
            <View style={styles.thresholdMarker}>
              <View style={styles.thresholdLine} />
              <Text style={styles.thresholdText}>{attendanceData.statutoryThreshold}% Min</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.qrScanBannerBtn}
          onPress={onOpenQrScanner}
          activeOpacity={0.8}
        >
          <QrCode size={18} color="#002541" />
          <Text style={styles.qrScanBannerText}>Launch Geofenced QR Scanner</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Segmented Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'OVERVIEW' && styles.activeTabBtn]}
          onPress={() => setActiveTab('OVERVIEW')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'OVERVIEW' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'SUBJECTS' && styles.activeTabBtn]}
          onPress={() => setActiveTab('SUBJECTS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'SUBJECTS' && styles.activeTabText]}>
            Subject Roster
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PETITIONS' && styles.activeTabBtn]}
          onPress={() => setActiveTab('PETITIONS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'PETITIONS' && styles.activeTabText]}>
            Petitions
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Subject-wise Roster */}
      {activeTab !== 'PETITIONS' ? (
        <View style={styles.subjectList}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 20 }} />
          ) : attendanceData.subjects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No attendance records recorded yet.</Text>
            </View>
          ) : (
            attendanceData.subjects.map((sub) => {
            const isWarning = sub.status === 'WARNING';
            return (
              <View
                key={sub.code}
                style={[styles.subjectCard, isWarning && styles.warningSubjectCard]}
              >
                <View style={styles.subjectHeader}>
                  <View style={styles.subCodeGroup}>
                    <Text style={styles.subCode}>{sub.code}</Text>
                    <Text style={styles.subName}>{sub.name}</Text>
                  </View>
                  <View style={styles.subPercentageCol}>
                    <Text
                      style={[
                        styles.subPercentage,
                        isWarning ? styles.warningText : styles.safeText,
                      ]}
                    >
                      {sub.percentage}%
                    </Text>
                    <Text style={styles.subCount}>
                      {sub.attended}/{sub.total} Classes
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.subProgressTrack}>
                  <View
                    style={[
                      styles.subProgressFill,
                      {
                        width: `${Math.min(sub.percentage, 100)}%`,
                        backgroundColor: isWarning ? '#F59E0B' : '#10B981',
                      },
                    ]}
                  />
                </View>

                <View style={styles.subFooter}>
                  <Text style={styles.facultyName}>{sub.faculty}</Text>
                  {isWarning ? (
                    <View style={styles.warningPill}>
                      <AlertTriangle size={11} color="#B45309" />
                      <Text style={styles.warningPillText}>
                        Attend {sub.neededFor75} more to reach 75%
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.safeStatusText}>Compliant</Text>
                  )}
                </View>
              </View>
            );
          }))}
        </View>
      ) : (
        /* Petitions tab */
        <View style={styles.petitionsContainer}>
          <View style={styles.petitionCard}>
            <View style={styles.petitionHeader}>
              <Text style={styles.petitionSubject}>CS-601 Compiler Design</Text>
              <View style={styles.approvedPill}>
                <Text style={styles.approvedText}>APPROVED</Text>
              </View>
            </View>
            <Text style={styles.petitionDetails}>
              Date: 20 May 2026 • Period 3 (Medical On-Duty Certificate Attached)
            </Text>
            <Text style={styles.petitionReviewer}>Approved by Dr. V. K. Bhatt (HOD)</Text>
          </View>

          <TouchableOpacity
            style={styles.newPetitionBtn}
            onPress={() => Alert.alert('Petition', 'Correction petition form opened.')}
          >
            <FileText size={16} color="#FFFFFF" />
            <Text style={styles.newPetitionBtnText}>Submit New Attendance Petition</Text>
          </TouchableOpacity>
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
    fontSize: 10,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 9,
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
    color: '#64748B',
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
    borderColor: '#E2E8F0',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#0B3B60',
  },
  subName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
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
    color: '#10B981',
  },
  warningText: {
    color: '#D97706',
  },
  subCount: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  subProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
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
    borderTopColor: '#F8FAFC',
  },
  facultyName: {
    fontSize: 11,
    color: '#64748B',
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
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  safeStatusText: {
    fontSize: 11,
    color: '#059669',
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
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  approvedPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  approvedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  petitionDetails: {
    fontSize: 11,
    color: '#64748B',
  },
  petitionReviewer: {
    fontSize: 10,
    color: '#94A3B8',
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
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
