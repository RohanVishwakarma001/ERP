import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useProfile, type Profile } from '@/features/account';
import { QueryState } from '@/components/common/query-state';
import { ROLE_LABELS } from '@/components/common/header';
import { Card, SectionTitle, StatusPill } from '@/components/ui/primitives';
import { formatCurrency, formatDate } from '@/lib/format';
import { Colors, MinTouchTarget, Spacing, Type } from '@/constants/theme';

const C = Colors.light;

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <View>
      {rows.map(([label, value], i) => (
        <View key={label} style={[styles.row, i > 0 && styles.rowDivider]} accessible accessibilityLabel={`${label}: ${typeof value === 'string' || typeof value === 'number' ? value : ''}`}>
          <Text style={styles.label}>{label}</Text>
          {typeof value === 'string' || typeof value === 'number' || value == null ? (
            <Text style={styles.value} selectable>
              {value === null || value === undefined || value === '' ? '—' : String(value)}
            </Text>
          ) : (
            <View style={styles.valueNode}>{value}</View>
          )}
        </View>
      ))}
    </View>
  );
}

function ProfileBody({ p }: { p: Profile }) {
  const s = p.student;
  const f = p.faculty;
  return (
    <View style={{ gap: Spacing.xl }}>
      <View style={styles.hero}>
        <Text style={styles.name}>{p.account.name}</Text>
        <Text style={styles.email} selectable>
          {p.account.email}
        </Text>
        <View style={styles.pills}>
          <StatusPill label={ROLE_LABELS[p.account.role] ?? p.account.role} tone="brand" />
          <StatusPill label={p.account.status === 'ACTIVE' ? 'Active' : p.account.status} tone={p.account.status === 'ACTIVE' ? 'success' : 'warning'} />
        </View>
      </View>

      <View>
        <SectionTitle title="Account" />
        <Card>
          <Rows
            rows={[
              ['Phone', p.account.phone],
              ['Member since', p.account.memberSince ? formatDate(p.account.memberSince) : null],
              ...(p.staff ? ([['Designation', p.staff.designation], ['Employee ID', p.staff.employeeId]] as [string, React.ReactNode][]) : []),
            ]}
          />
        </Card>
      </View>

      {s && (
        <>
          <View>
            <SectionTitle title="Academic details" />
            <Card>
              <Rows
                rows={[
                  ['Roll number', s.rollNumber],
                  ['Enrollment number', s.enrollmentNumber],
                  ['Program', `${s.program.name} (${s.program.code})`],
                  ['Department', s.department.name],
                  ['Semester', `${s.semester} of ${s.totalSemesters}`],
                  ['Section', s.section],
                  ['Admission year', s.admissionYear],
                  ['CGPA', s.cgpa ? s.cgpa.toFixed(2) : null],
                  ['Attendance', s.isDebarred ? <StatusPill key="a" label={`${s.overallAttendance}% · debarred`} tone="danger" /> : `${s.overallAttendance}%`],
                  ['KYC', <StatusPill key="k" label={s.kycVerified ? 'Verified' : 'Pending'} tone={s.kycVerified ? 'success' : 'warning'} />],
                ]}
              />
            </Card>
          </View>
          <View>
            <SectionTitle title="Fees, guardian, hostel & transport" />
            <Card>
              <Rows
                rows={[
                  ['Outstanding fees', s.fees.pendingDues ? <StatusPill key="f" label={`${formatCurrency(s.fees.pendingDues)}${s.fees.overdue ? ' · overdue' : ''}`} tone="danger" /> : <StatusPill key="f" label="No dues" tone="success" />],
                  ['Guardian', s.guardianName],
                  ['Guardian phone', s.guardianPhone],
                  ['Hostel', s.hostel ? `${s.hostel.building} · room ${s.hostel.room}, bed ${s.hostel.bed}` : 'Not allocated'],
                  ['Bus pass', s.transport ? `${s.transport.route} · ${s.transport.pickupStop}` : 'None'],
                ]}
              />
            </Card>
          </View>
        </>
      )}

      {f && (
        <View>
          <SectionTitle title="Employment details" />
          <Card>
            <Rows
              rows={[
                ['Employee code', f.employeeCode],
                ['Department', f.department.name],
                ['Designation', f.designation],
                ['Qualification', f.qualification],
                ['Specialization', f.specialization],
                ['Courses', f.subjects.length ? f.subjects.map((c) => `${c.code} ${c.name}`).join('\n') : 'None assigned'],
              ]}
            />
          </Card>
        </View>
      )}

      <Text style={styles.footnote}>To correct any of these details, contact the administration office. Change your password from “Forgot password” on the sign-in screen.</Text>
    </View>
  );
}

/** Full-height sheet with everything the institute holds about the signed-in user. */
export function ProfileSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const profile = useProfile(visible);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            My profile
          </Text>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close profile" hitSlop={6}>
            <X size={22} color={C.textSecondary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <QueryState query={profile} isEmpty={() => false}>
            {(p) => <ProfileBody p={p} />}
          </QueryState>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  title: { ...Type.headline, color: C.text },
  close: { width: MinTouchTarget, height: MinTouchTarget, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  hero: { alignItems: 'center', gap: 4, paddingVertical: Spacing.md },
  name: { ...Type.title, color: C.text, textAlign: 'center' },
  email: { ...Type.subhead, color: C.textSecondary, textAlign: 'center' },
  pills: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  row: { paddingVertical: Spacing.sm + 2, gap: 2 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  label: { ...Type.caption, color: C.textSecondary },
  value: { ...Type.body, color: C.text },
  valueNode: { flexDirection: 'row', marginTop: 2 },
  footnote: { ...Type.caption, color: C.textSecondary, paddingHorizontal: 4, lineHeight: 18 },
});
