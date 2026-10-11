import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, LogOut, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkload } from '@/features/faculty';
import { QueryState } from '@/components/common/query-state';
import { Button, Card, IconTile, ListRow, SectionTitle, StatusPill } from '@/components/ui/primitives';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';

const C = Colors.light;

interface FacultyMoreViewProps {
  onOpenCopilot: () => void;
}

export function FacultyMoreView({ onOpenCopilot }: FacultyMoreViewProps) {
  const { logout } = useAuthStore();
  const workload = useWorkload();

  const handleSignOut = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <SectionTitle title="My teaching load" />
        <QueryState query={workload}>
          {(w) => {
            const meets = w.weeklyContactHours >= w.aicteStandardHours;
            const pct = Math.min(100, w.aicteStandardHours ? (w.weeklyContactHours / w.aicteStandardHours) * 100 : 0);
            return (
              <Card>
                <View style={styles.loadRow}>
                  <Text style={styles.loadValue} accessibilityLabel={`${w.weeklyContactHours} of ${w.aicteStandardHours} hours per week`}>
                    {w.weeklyContactHours}
                    <Text style={styles.loadUnit}> / {w.aicteStandardHours} h per week</Text>
                  </Text>
                  <StatusPill label={meets ? 'Meets AICTE norm' : 'Below AICTE norm'} tone={meets ? 'success' : 'warning'} />
                </View>
                <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: meets ? C.success : C.warning }]} />
                </View>
                <Text style={styles.loadNote}>
                  {w.assignedClasses.length} timetabled class{w.assignedClasses.length === 1 ? '' : 'es'} · {w.department}
                </Text>
              </Card>
            );
          }}
        </QueryState>
      </View>

      <View>
        <SectionTitle title="Tools" />
        <Card padded={false} style={{ paddingHorizontal: Spacing.lg }}>
          <ListRow
            leading={
              <IconTile>
                <Sparkles size={20} color={C.primaryContainer} />
              </IconTile>
            }
            title="Campus assistant"
            subtitle="Quick answers from campus records"
            trailing={<ChevronRight size={18} color={C.textMuted} />}
            onPress={onOpenCopilot}
          />
        </Card>
        <Text style={styles.footnote}>Leave applications and petition reviews are handled by your department office on the web portal.</Text>
      </View>

      <Button label="Sign out" variant="danger" icon={<LogOut size={18} color={C.danger} />} onPress={handleSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.lg, gap: Spacing.xxl, paddingBottom: Spacing.xxxl },
  loadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, flexWrap: 'wrap' },
  loadValue: { ...Type.title, color: C.text },
  loadUnit: { ...Type.subhead, color: C.textSecondary },
  track: { height: 8, borderRadius: Radius.full, backgroundColor: C.backgroundSelected, overflow: 'hidden', marginTop: Spacing.md },
  fill: { height: '100%', borderRadius: Radius.full },
  loadNote: { ...Type.subhead, color: C.textSecondary, marginTop: Spacing.sm },
  footnote: { ...Type.caption, color: C.textSecondary, marginTop: Spacing.sm, paddingHorizontal: 4 },
});
