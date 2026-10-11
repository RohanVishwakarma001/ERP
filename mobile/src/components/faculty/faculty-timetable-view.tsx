import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Award } from 'lucide-react-native';
import { Shadows, Spacing } from '@/constants/theme';
import { WeeklySchedule } from '@/components/common/weekly-schedule';
import { useWorkload } from '@/features/faculty';

export function FacultyTimetableView() {
  const workload = useWorkload();
  const w = workload.data;
  const meetsNorm = w ? w.weeklyContactHours >= w.aicteStandardHours : false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.complianceCard}>
        <View style={styles.complianceHeader}>
          <View>
            <Text style={styles.complianceSub}>AICTE WORKLOAD NORM</Text>
            <Text style={styles.complianceTitle}>{w ? `${w.weeklyContactHours} contact hours / week` : '—'}</Text>
            <Text style={styles.complianceMeta}>{w ? `Required: ${w.aicteStandardHours} hours` : workload.isError ? 'Workload unavailable' : 'Loading…'}</Text>
          </View>
          {w && w.compliancePercentage !== null && (
            <View style={[styles.badge, !meetsNorm && styles.badgeWarn]}>
              <Award size={18} color={meetsNorm ? '#059669' : '#B45309'} />
              <Text style={[styles.badgeText, !meetsNorm && styles.badgeWarnText]}>{w.compliancePercentage}%</Text>
            </View>
          )}
        </View>
      </View>

      <WeeklySchedule audience="faculty" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: Spacing.lg, paddingBottom: 32, gap: Spacing.lg },
  complianceCard: { backgroundColor: '#002541', borderRadius: 20, padding: Spacing.xl, ...Shadows.md },
  complianceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  complianceSub: { fontSize: 12, fontWeight: '800', color: '#93C5FD', letterSpacing: 0.5 },
  complianceTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  complianceMeta: { fontSize: 12, color: '#BAE6FD', marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#065F46' },
  badgeWarn: { backgroundColor: '#FFFBEB' },
  badgeWarnText: { color: '#92400E' },
});
