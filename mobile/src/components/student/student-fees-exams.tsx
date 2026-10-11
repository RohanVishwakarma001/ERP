import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { CreditCard, Download, FileBadge } from 'lucide-react-native';
import { useMyExams, useMyFees, useOpenAdmitCard, type FeeStatus, type MyExams } from '@/features/account';
import { QueryState } from '@/components/common/query-state';
import { Button, Card, EmptyNote, SectionTitle, StatusPill } from '@/components/ui/primitives';
import { env } from '@/config/env';
import { getErrorMessage } from '@/lib/api/api-error';
import { formatCurrency, formatDate } from '@/lib/format';
import { Colors, Spacing, Type } from '@/constants/theme';

const C = Colors.light;
const FEE_TONE: Record<FeeStatus, 'success' | 'brand' | 'warning' | 'danger'> = { PAID: 'success', PARTIAL: 'brand', PENDING: 'warning', OVERDUE: 'danger' };

/** Fee summary and per-semester accounts (GET /fees/me). Payment itself happens on the web portal. */
export function FeeStatusSection() {
  const fees = useMyFees();
  return (
    <View>
      <SectionTitle title="Fee status" />
      <QueryState query={fees} isEmpty={() => false}>
        {(f) =>
          f.accounts.length === 0 ? (
            <Card>
              <EmptyNote title="No fees billed yet" message="Your semester fee will appear here once the accounts office bills it." />
            </Card>
          ) : (
            <Card>
              <View style={styles.feeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feeLabel}>Outstanding</Text>
                  <Text style={[styles.feeAmount, f.pendingDues > 0 && { color: C.danger }]}>{f.pendingDues > 0 ? formatCurrency(f.pendingDues) : 'No dues'}</Text>
                  {f.nextDueDate && f.pendingDues > 0 && <Text style={styles.feeMeta}>Next due {formatDate(f.nextDueDate)}</Text>}
                </View>
                <StatusPill label={f.clearanceStatus === 'CLEARED' ? 'Cleared' : 'Dues pending'} tone={f.clearanceStatus === 'CLEARED' ? 'success' : 'warning'} />
              </View>
              <Text style={styles.feeMeta}>
                Paid {formatCurrency(f.paidFee)} of {formatCurrency(f.totalFee)}
              </Text>
              {f.accounts.map((a) => (
                <View key={a.id} style={styles.accountRow} accessible accessibilityLabel={`Semester ${a.semester}, ${a.status}, balance ${formatCurrency(a.pendingAmount)}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountTitle}>
                      Semester {a.semester} · {a.academicYear}
                    </Text>
                    <Text style={styles.feeMeta}>
                      Balance {formatCurrency(a.pendingAmount)} · due {formatDate(a.dueDate)}
                    </Text>
                  </View>
                  <StatusPill label={a.status.charAt(0) + a.status.slice(1).toLowerCase()} tone={FEE_TONE[a.status]} />
                </View>
              ))}
              {f.pendingDues > 0 && env.webUrl && (
                <Button
                  label="Pay on the web portal"
                  icon={<CreditCard size={18} color="#FFFFFF" />}
                  onPress={() => openBrowserAsync(`${env.webUrl}/student/fees`)}
                  accessibilityLabel="Pay fees on the web portal"
                  style={{ marginTop: Spacing.md }}
                />
              )}
            </Card>
          )
        }
      </QueryState>
    </View>
  );
}

function ExamCard({ exam, data }: { exam: MyExams['exams'][number]; data: MyExams }) {
  const open = useOpenAdmitCard();
  const card = exam.admitCard;
  const busy = open.isPending && open.variables === card?.id;

  return (
    <Card>
      <View style={styles.examHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.examTitle}>{exam.title}</Text>
          <Text style={styles.feeMeta}>
            {exam.cycle} · {exam.papers.length} paper{exam.papers.length === 1 ? '' : 's'}
          </Text>
        </View>
        {card?.status === 'APPROVED' ? (
          <StatusPill label="Approved" tone="success" />
        ) : card?.status === 'REVOKED' ? (
          <StatusPill label="Revoked" tone="danger" />
        ) : (
          <StatusPill label="Awaiting approval" tone="warning" />
        )}
      </View>

      {exam.papers.map((p) => (
        <Text key={p.id} style={styles.paper}>
          {formatDate(p.date)} · {p.startTime} · <Text style={{ fontWeight: '600' }}>{p.code}</Text> {p.name}
        </Text>
      ))}

      {card?.status === 'APPROVED' ? (
        <Button
          label="Download admit card"
          icon={<Download size={18} color="#FFFFFF" />}
          loading={busy}
          onPress={() => open.mutate(card.id, { onError: (err) => Alert.alert('Could not open admit card', getErrorMessage(err)) })}
          accessibilityLabel={`Download admit card for ${exam.title}`}
          style={{ marginTop: Spacing.md }}
        />
      ) : card?.status === 'REVOKED' ? (
        <Text style={[styles.note, { color: C.danger }]}>{card.remarks ?? 'Contact the examination cell.'}</Text>
      ) : (
        <Text style={styles.note}>
          The administration approves admit cards after verifying fees and attendance.
          {!data.fees.cleared ? ` Clear your outstanding fees of ${formatCurrency(data.fees.pending)} first.` : ''}
          {data.isDebarred ? ' Your attendance is below 75%.' : ''}
        </Text>
      )}
    </Card>
  );
}

/** Exams with papers for the student's program and semester, with admit card download (GET /admit-cards/me). */
export function AdmitCardsSection() {
  const exams = useMyExams();
  return (
    <View>
      <SectionTitle title="Exams & admit card" />
      <QueryState query={exams} isEmpty={() => false}>
        {(d) =>
          d.exams.length === 0 ? (
            <Card>
              <View style={{ alignItems: 'center', gap: Spacing.sm }}>
                <FileBadge size={22} color={C.textMuted} />
                <EmptyNote title="No exams scheduled" message="Your exam timetable and admit card will appear here." />
              </View>
            </Card>
          ) : (
            <View style={{ gap: Spacing.md }}>
              {d.exams.map((exam) => (
                <ExamCard key={exam.examId} exam={exam} data={d} />
              ))}
            </View>
          )
        }
      </QueryState>
    </View>
  );
}

const styles = StyleSheet.create({
  feeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  feeLabel: { ...Type.caption, color: C.textSecondary },
  feeAmount: { ...Type.title, color: C.text, marginTop: 2 },
  feeMeta: { ...Type.subhead, color: C.textSecondary, marginTop: 2 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.md, marginTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  accountTitle: { ...Type.callout, color: C.text },
  examHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  examTitle: { ...Type.headline, color: C.text },
  paper: { ...Type.subhead, color: C.text, marginTop: 4 },
  note: { ...Type.subhead, color: C.textSecondary, marginTop: Spacing.md },
});
