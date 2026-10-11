import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Spacing } from '@/constants/theme';
import { WeeklySchedule } from '@/components/common/weekly-schedule';

export function StudentScheduleView() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <WeeklySchedule audience="student" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: Spacing.lg, paddingBottom: 32, gap: Spacing.lg },
});
