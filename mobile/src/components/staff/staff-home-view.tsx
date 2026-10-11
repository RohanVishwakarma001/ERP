import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BookOpen, Laptop, LogOut, Search } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useNotices } from '@/features/campus';
import { useCatalogue, useExecutiveSummary, useLibraryLoans, useReturnBook, type LibraryLoan } from '@/features/staff';
import { QueryState } from '@/components/common/query-state';
import { ROLE_LABELS } from '@/components/common/header';
import { Button, Card, EmptyNote, IconTile, ListRow, SectionTitle, StatusPill } from '@/components/ui/primitives';
import { getErrorMessage } from '@/lib/api/api-error';
import { formatCurrency, formatDate } from '@/lib/format';
import { Colors, MinTouchTarget, Radius, Spacing, Type } from '@/constants/theme';

const C = Colors.light;
const LIBRARY_ROLES = new Set(['LIBRARIAN', 'ADMIN', 'SUPER_ADMIN']);
const EXECUTIVE_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']);

const pct = (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n * 10) / 10}%`);

/**
 * Home screen for staff roles (administrators, librarians and other offices).
 * Shows only what that role is authorised for; the full consoles live on the web.
 */
export function StaffHomeView() {
  const { user, logout } = useAuthStore();
  const role = user?.role ?? '';
  const isLibrary = LIBRARY_ROLES.has(role);
  const isExecutive = EXECUTIVE_ROLES.has(role);

  const summary = useExecutiveSummary(isExecutive);
  const loans = useLibraryLoans(isLibrary);
  const notices = useNotices();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([notices.refetch(), isExecutive && summary.refetch(), isLibrary && loans.refetch()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primaryContainer} />}
    >
      <View>
        <Text style={styles.eyebrow}>{user ? ROLE_LABELS[user.role] : ''}</Text>
        <Text style={styles.greeting} accessibilityRole="header">
          Hello, {user?.name?.split(' ')[0] ?? 'there'}
        </Text>
      </View>

      {isExecutive && (
        <View>
          <SectionTitle title="Institution at a glance" />
          <QueryState query={summary}>
            {(s) => (
              <View style={styles.statGrid}>
                <Stat label="Students" value={s.totalEnrolledStudents.toLocaleString('en-IN')} note={`${s.debarredStudentsCount} debarred`} />
                <Stat label="Faculty" value={s.activeFacultyCount.toLocaleString('en-IN')} note={`${s.departmentsCount} departments`} />
                <Stat label="Avg attendance" value={pct(s.overallCampusAttendance)} />
                <Stat label="Fee collection" value={pct(s.feeCollectionRate)} note={`${formatCurrency(s.totalFeeCollected)} collected`} />
              </View>
            )}
          </QueryState>
        </View>
      )}

      {isLibrary && <LibraryDesk loans={loans} />}

      <View>
        <SectionTitle title="Notices" />
        <Card padded={false} style={{ paddingHorizontal: Spacing.lg }}>
          <QueryState query={notices} emptyText="No notices right now.">
            {(list) => (
              <>
                {list.slice(0, 5).map((n, i) => (
                  <View key={n.id} style={[styles.notice, i > 0 && styles.divider]}>
                    <View style={styles.noticeHead}>
                      {n.isUrgent && <StatusPill label="Urgent" tone="danger" />}
                      <Text style={styles.noticeTitle}>{n.title}</Text>
                    </View>
                    <Text style={styles.noticeBody} numberOfLines={3}>
                      {n.summary}
                    </Text>
                    <Text style={styles.noticeMeta}>
                      {n.authorName} · {formatDate(n.publishedAt)}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </QueryState>
        </Card>
      </View>

      <Card style={styles.webCard}>
        <IconTile>
          <Laptop size={20} color={C.primaryContainer} />
        </IconTile>
        <View style={{ flex: 1 }}>
          <Text style={styles.webTitle}>Full console on the web</Text>
          <Text style={styles.webBody}>
            Departments, rosters, timetables, exams and reports are managed from the JBIT ERP web portal on a computer.
          </Text>
        </View>
      </Card>

      <Button
        label="Sign out"
        variant="danger"
        icon={<LogOut size={18} color={C.danger} />}
        onPress={() =>
          Alert.alert('Sign out?', 'You will need to sign in again to use the app.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => logout() },
          ])
        }
      />
    </ScrollView>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}${note ? `, ${note}` : ''}`}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {note ? (
        <Text style={styles.statNote} numberOfLines={1}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

function LibraryDesk({ loans }: { loans: ReturnType<typeof useLibraryLoans> }) {
  const returnBook = useReturnBook();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const catalogue = useCatalogue(submitted, submitted.length >= 2);

  const confirmReturn = (loan: LibraryLoan) => {
    const fineNote = loan.overdueDays > 0 ? `\n\nThis book is ${loan.overdueDays} day(s) overdue; a fine of about ${formatCurrency(loan.accruedFine)} will be recorded.` : '';
    Alert.alert('Record return?', `${loan.bookTitle}\nfrom ${loan.studentName} (${loan.rollNumber})${fineNote}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Record return',
        onPress: () =>
          returnBook.mutate(loan.id, {
            onSuccess: (res) =>
              Alert.alert('Returned', res.fineAmount > 0 ? `Fine recorded: ${formatCurrency(res.fineAmount)}.` : 'The copy is back on the shelf.'),
            onError: (err) => Alert.alert('Could not record return', getErrorMessage(err)),
          }),
      },
    ]);
  };

  return (
    <>
      <View>
        <SectionTitle title="Books on loan" />
        <Card padded={false} style={{ paddingHorizontal: Spacing.lg }}>
          <QueryState query={loans} emptyText="No books are currently on loan.">
            {(list) => (
              <>
                {list.map((l, i) => (
                  <View key={l.id} style={i > 0 && styles.divider}>
                    <ListRow
                      title={l.bookTitle}
                      subtitle={`${l.studentName} · ${l.rollNumber}\nDue ${formatDate(l.dueDate)}${l.overdueDays > 0 ? ` · fine ${formatCurrency(l.accruedFine)}` : ''}`}
                      trailing={
                        <View style={styles.loanActions}>
                          <StatusPill label={l.overdueDays > 0 ? `${l.overdueDays}d overdue` : 'On time'} tone={l.overdueDays > 0 ? 'danger' : 'success'} />
                          <Button
                            label="Return"
                            variant="secondary"
                            accessibilityLabel={`Record return of ${l.bookTitle}`}
                            onPress={() => confirmReturn(l)}
                            disabled={returnBook.isPending}
                          />
                        </View>
                      }
                    />
                  </View>
                ))}
              </>
            )}
          </QueryState>
        </Card>
        <Text style={styles.footnote}>Issue new loans from the web portal, where you can look up students and copies.</Text>
      </View>

      <View>
        <SectionTitle title="Catalogue search" />
        <View style={styles.searchRow}>
          <Search size={18} color={C.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setSubmitted(query.trim())}
            placeholder="Title, author or ISBN"
            placeholderTextColor={C.textMuted}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search the library catalogue"
            style={styles.searchInput}
          />
        </View>
        {submitted.length >= 2 && (
          <Card padded={false} style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.sm }}>
            <QueryState query={catalogue} emptyText={`No books match “${submitted}”.`}>
              {(books) => (
                <>
                  {books.slice(0, 10).map((b, i) => (
                    <View key={b.id} style={i > 0 && styles.divider}>
                      <ListRow
                        leading={
                          <IconTile>
                            <BookOpen size={18} color={C.primaryContainer} />
                          </IconTile>
                        }
                        title={b.title}
                        subtitle={`${b.authors.join(', ')}${b.shelfLocation ? ` · Shelf ${b.shelfLocation}` : ''}`}
                        trailing={<StatusPill label={`${b.availableCopies}/${b.totalCopies}`} tone={b.availableCopies > 0 ? 'success' : 'danger'} />}
                      />
                    </View>
                  ))}
                </>
              )}
            </QueryState>
          </Card>
        )}
        {submitted.length > 0 && submitted.length < 2 && <EmptyNote title="Type at least 2 characters" />}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing.lg, gap: Spacing.xxl, paddingBottom: Spacing.xxxl },
  eyebrow: { ...Type.subhead, fontWeight: '600', color: C.primaryContainer },
  greeting: { ...Type.largeTitle, color: C.text, marginTop: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: C.card,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    padding: Spacing.lg,
  },
  statLabel: { ...Type.subhead, color: C.textSecondary },
  statValue: { ...Type.title, color: C.text, marginTop: 4 },
  statNote: { ...Type.caption, color: C.textSecondary, marginTop: 2 },
  notice: { paddingVertical: Spacing.md, gap: 4 },
  noticeHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  noticeTitle: { ...Type.callout, fontWeight: '600', color: C.text, flexShrink: 1 },
  noticeBody: { ...Type.subhead, color: C.textSecondary },
  noticeMeta: { ...Type.caption, color: C.textMuted },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  loanActions: { alignItems: 'flex-end', gap: 6 },
  footnote: { ...Type.caption, color: C.textSecondary, marginTop: Spacing.sm, paddingHorizontal: 4 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: C.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    paddingHorizontal: Spacing.md,
    minHeight: MinTouchTarget + 4,
  },
  searchInput: { flex: 1, ...Type.body, color: C.text, paddingVertical: Spacing.sm },
  webCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  webTitle: { ...Type.callout, fontWeight: '600', color: C.text },
  webBody: { ...Type.subhead, color: C.textSecondary, marginTop: 2 },
});
