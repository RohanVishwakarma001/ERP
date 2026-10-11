import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { ChevronRight, CreditCard, HelpCircle, LogOut, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useApplyToDrive, useMyComplaints, usePlacementDrives } from '@/features/campus';
import { QueryState } from '@/components/common/query-state';
import { GrievanceSheet } from '@/components/modals/grievance-sheet';
import { Button, Card, IconTile, ListRow, SectionTitle, StatusPill } from '@/components/ui/primitives';
import { env } from '@/config/env';
import { formatDate } from '@/lib/format';
import { Colors, Spacing, Type } from '@/constants/theme';

const C = Colors.light;

const TICKET_TONE = { OPEN: 'danger', ASSIGNED: 'brand', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'neutral' } as const;

interface StudentMoreViewProps {
  onOpenCopilot: () => void;
}

export function StudentMoreView({ onOpenCopilot }: StudentMoreViewProps) {
  const { logout } = useAuthStore();
  const drives = usePlacementDrives();
  const apply = useApplyToDrive();
  const tickets = useMyComplaints(true);
  const [grievanceOpen, setGrievanceOpen] = useState(false);

  const handleApply = (driveId: string, company: string) =>
    Alert.alert('Apply to this drive?', `Your profile will be shared with ${company}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply', onPress: () => apply.mutate(driveId, { onSuccess: (res) => Alert.alert('Application submitted', res.message) }) },
    ]);

  const handleSignOut = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <SectionTitle title="Placement drives" />
        <QueryState query={drives} emptyText="No placement drives announced yet.">
          {(list) => (
            <View style={{ gap: Spacing.md }}>
              {list.map((drive) => {
                const isOpen = drive.status === 'LIVE';
                const applied = drive.myApplicationStatus !== null;
                const isApplying = apply.isPending && apply.variables === drive.id;
                return (
                  <Card key={drive.id}>
                    <View style={styles.driveHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.driveCompany}>{drive.companyName}</Text>
                        <Text style={styles.driveRole}>{drive.roleTitle}</Text>
                      </View>
                      <StatusPill label={drive.ctc} tone="brand" />
                    </View>
                    <Text style={styles.driveMeta}>
                      Minimum CGPA {drive.minCgpa} · {drive.location}
                    </Text>
                    <View style={styles.driveFooter}>
                      <Text style={styles.driveMeta}>{isOpen ? `Closes ${formatDate(drive.deadline)}` : 'Applications closed'}</Text>
                      {applied ? (
                        <StatusPill label={drive.myApplicationStatus!.replace('_', ' ')} tone="success" />
                      ) : isOpen ? (
                        <Button
                          label="Apply"
                          loading={isApplying}
                          accessibilityLabel={`Apply to ${drive.companyName}`}
                          onPress={() => handleApply(drive.id, drive.companyName)}
                        />
                      ) : null}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </QueryState>
      </View>

      <View>
        <SectionTitle title="Services" />
        <Card padded={false} style={styles.menu}>
          <ListRow
            leading={
              <IconTile tone="warning">
                <HelpCircle size={20} color={C.warning} />
              </IconTile>
            }
            title="Raise a grievance"
            subtitle="Academic, hostel, transport, infrastructure, fees or ragging"
            trailing={<ChevronRight size={18} color={C.textMuted} />}
            onPress={() => setGrievanceOpen(true)}
          />
          {env.webUrl && (
            <View style={styles.divider}>
              <ListRow
                leading={
                  <IconTile tone="success">
                    <CreditCard size={20} color={C.success} />
                  </IconTile>
                }
                title="Fees & payments"
                subtitle="View dues and pay securely on the web portal"
                trailing={<ChevronRight size={18} color={C.textMuted} />}
                accessibilityHint="Opens the web portal in an in-app browser"
                onPress={() => openBrowserAsync(`${env.webUrl}/student/fees`)}
              />
            </View>
          )}
          <View style={styles.divider}>
            <ListRow
              leading={
                <IconTile>
                  <Sparkles size={20} color={C.primaryContainer} />
                </IconTile>
              }
              title="Campus assistant"
              subtitle="Ask about attendance, fees, classes and exams"
              trailing={<ChevronRight size={18} color={C.textMuted} />}
              onPress={onOpenCopilot}
            />
          </View>
        </Card>
      </View>

      {tickets.data && tickets.data.length > 0 && (
        <View>
          <SectionTitle title="My grievances" />
          <Card padded={false} style={styles.menu}>
            {tickets.data.slice(0, 5).map((t, i) => (
              <View key={t.id} style={i > 0 && styles.divider}>
                <ListRow
                  title={t.title}
                  subtitle={`${t.ticketNumber} · ${formatDate(t.createdAt)}`}
                  trailing={<StatusPill label={t.status.replace('_', ' ')} tone={TICKET_TONE[t.status]} />}
                />
              </View>
            ))}
          </Card>
        </View>
      )}

      <Button label="Sign out" variant="danger" icon={<LogOut size={18} color={C.danger} />} onPress={handleSignOut} />

      <GrievanceSheet visible={grievanceOpen} onClose={() => setGrievanceOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.lg, gap: Spacing.xxl, paddingBottom: Spacing.xxxl },
  menu: { paddingHorizontal: Spacing.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  driveHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  driveCompany: { ...Type.headline, color: C.text },
  driveRole: { ...Type.subhead, color: C.textSecondary, marginTop: 2 },
  driveMeta: { ...Type.subhead, color: C.textSecondary, marginTop: Spacing.sm },
  driveFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, marginTop: Spacing.xs },
});
