import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Award, BookOpen, Calendar, CheckCheck, Home, Layers, QrCode, type LucideIcon } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, MinTouchTarget, Spacing, Type } from '@/constants/theme';
import { AppHeader } from '@/components/common/header';
import { LoginView } from '@/components/auth/login-view';
import { StudentHomeView } from '@/components/student/student-home-view';
import { StudentAcademicsView } from '@/components/student/student-academics-view';
import { StudentAttendanceView } from '@/components/student/student-attendance-view';
import { StudentScheduleView } from '@/components/student/student-schedule-view';
import { StudentMoreView } from '@/components/student/student-more-view';
import { FacultyHomeView } from '@/components/faculty/faculty-home-view';
import { FacultyAttendanceView } from '@/components/faculty/faculty-attendance-view';
import { FacultyMarksView } from '@/components/faculty/faculty-marks-view';
import { FacultyTimetableView } from '@/components/faculty/faculty-timetable-view';
import { FacultyMoreView } from '@/components/faculty/faculty-more-view';
import { StaffHomeView } from '@/components/staff/staff-home-view';
import { QrScannerModal } from '@/components/modals/qr-scanner-modal';
import { QrBroadcasterModal } from '@/components/modals/qr-broadcaster-modal';
import { AiCopilotModal } from '@/components/modals/ai-copilot-modal';
import { NotificationsSheet } from '@/components/modals/notifications-sheet';
import type { FacultyClassItem } from '@/types';

const C = Colors.light;

type StudentTab = 'home' | 'academics' | 'attendance' | 'schedule' | 'more';
type FacultyTab = 'home' | 'attendance' | 'marks' | 'timetable' | 'more';

interface TabSpec<T extends string> {
  key: T;
  label: string;
  icon: LucideIcon;
  /** The prominent centre action (student QR attendance). */
  primary?: boolean;
}

const STUDENT_TABS: TabSpec<StudentTab>[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'academics', label: 'Academics', icon: BookOpen },
  { key: 'attendance', label: 'Attendance', icon: QrCode, primary: true },
  { key: 'schedule', label: 'Schedule', icon: Calendar },
  { key: 'more', label: 'More', icon: Layers },
];

const FACULTY_TABS: TabSpec<FacultyTab>[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'attendance', label: 'Attendance', icon: CheckCheck },
  { key: 'marks', label: 'Marks', icon: Award },
  { key: 'timetable', label: 'Schedule', icon: Calendar },
  { key: 'more', label: 'More', icon: Layers },
];

const TEACHING_ROLES = new Set(['FACULTY', 'HOD']);

export default function MobileAppRoot() {
  const { user, authStatus, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (authStatus === 'loading') {
    return (
      <SafeAreaView style={styles.splash}>
        <Image source={require('@/assets/images/jbit-logo.png')} style={styles.splashLogo} contentFit="contain" accessibilityLabel="JBIT logo" />
        <Text style={styles.splashTitle}>JBIT Campus ERP</Text>
        <Text style={styles.splashSubtitle}>JB Institute of Technology, Dehradun</Text>
        <View style={styles.splashStatus} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color={C.primaryContainer} />
          <Text style={styles.splashStatusText}>Restoring your session…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (authStatus === 'unauthenticated' || !user) {
    return (
      <SafeAreaView style={styles.loginSafeArea}>
        <LoginView />
      </SafeAreaView>
    );
  }

  // Keyed by account: signing in as someone else starts with fresh tabs and closed sheets.
  return <SignedInApp key={user.id} role={user.role} />;
}

function SignedInApp({ role }: { role: string }) {
  const audience = role === 'STUDENT' ? 'student' : TEACHING_ROLES.has(role) ? 'teaching' : 'staff';

  const [studentTab, setStudentTab] = useState<StudentTab>('home');
  const [facultyTab, setFacultyTab] = useState<FacultyTab>('home');

  const [scannerVisible, setScannerVisible] = useState(false);
  const [broadcastClass, setBroadcastClass] = useState<FacultyClassItem | null>(null);
  const broadcasterVisible = broadcastClass !== null;
  const [copilotVisible, setCopilotVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  // Android back: close the top-most sheet first, then return to Home, then let the OS handle it.
  useEffect(() => {
    const onBackPress = () => {
      if (notificationsVisible) return setNotificationsVisible(false), true;
      if (copilotVisible) return setCopilotVisible(false), true;
      if (scannerVisible) return setScannerVisible(false), true;
      if (broadcasterVisible) return setBroadcastClass(null), true;
      if (audience === 'teaching' && facultyTab !== 'home') return setFacultyTab('home'), true;
      if (audience === 'student' && studentTab !== 'home') return setStudentTab('home'), true;
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [notificationsVisible, copilotVisible, scannerVisible, broadcasterVisible, audience, facultyTab, studentTab]);

  const header = (
    <AppHeader
      canGoBack={audience === 'student' ? studentTab !== 'home' : audience === 'teaching' ? facultyTab !== 'home' : false}
      onBack={() => (audience === 'teaching' ? setFacultyTab('home') : setStudentTab('home'))}
      title={
        audience === 'student'
          ? STUDENT_TABS.find((t) => t.key === studentTab)?.label
          : FACULTY_TABS.find((t) => t.key === facultyTab)?.label
      }
      onOpenCopilot={audience === 'staff' ? undefined : () => setCopilotVisible(true)}
      onOpenNotifications={() => setNotificationsVisible(true)}
    />
  );

  return (
    // Bottom inset is applied by the tab bar (or the staff screen) itself, so it's never doubled.
    <SafeAreaView style={styles.safeArea} edges={audience === 'staff' ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      {header}

      <View style={styles.main}>
        {audience === 'staff' && <StaffHomeView />}

        {audience === 'teaching' && (
          <>
            {facultyTab === 'home' && <FacultyHomeView onOpenBroadcaster={setBroadcastClass} onNavigateTab={(tab) => setFacultyTab(tab as FacultyTab)} />}
            {facultyTab === 'attendance' && <FacultyAttendanceView onOpenBroadcaster={setBroadcastClass} />}
            {facultyTab === 'marks' && <FacultyMarksView />}
            {facultyTab === 'timetable' && <FacultyTimetableView />}
            {facultyTab === 'more' && <FacultyMoreView onOpenCopilot={() => setCopilotVisible(true)} />}
          </>
        )}

        {audience === 'student' && (
          <>
            {studentTab === 'home' && (
              <StudentHomeView
                onOpenQrScanner={() => setScannerVisible(true)}
                onOpenCopilot={() => setCopilotVisible(true)}
                onNavigateTab={(tab) => setStudentTab(tab as StudentTab)}
              />
            )}
            {studentTab === 'academics' && <StudentAcademicsView />}
            {studentTab === 'attendance' && <StudentAttendanceView onOpenQrScanner={() => setScannerVisible(true)} />}
            {studentTab === 'schedule' && <StudentScheduleView />}
            {studentTab === 'more' && <StudentMoreView onOpenCopilot={() => setCopilotVisible(true)} />}
          </>
        )}
      </View>

      {audience === 'student' && <TabBar tabs={STUDENT_TABS} active={studentTab} onChange={setStudentTab} />}
      {audience === 'teaching' && <TabBar tabs={FACULTY_TABS} active={facultyTab} onChange={setFacultyTab} />}

      {audience === 'student' && (
        <QrScannerModal
          key={scannerVisible ? 'scanner-open' : 'scanner-closed'}
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onSuccess={(detail) => Alert.alert('Attendance marked', detail)}
        />
      )}

      {audience === 'teaching' && (
        // Keyed per class so every broadcast starts with a fresh scan tally.
        <QrBroadcasterModal
          key={broadcastClass ? `broadcast-${broadcastClass.id}` : 'broadcast-closed'}
          classItem={broadcastClass}
          onClose={() => setBroadcastClass(null)}
        />
      )}

      {audience !== 'staff' && <AiCopilotModal visible={copilotVisible} onClose={() => setCopilotVisible(false)} />}
      <NotificationsSheet visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />
    </SafeAreaView>
  );
}

function TabBar<T extends string>({ tabs, active, onChange }: { tabs: TabSpec<T>[]; active: T; onChange: (tab: T) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab.key === active;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.6 }]}
          >
            {tab.primary ? (
              <View style={[styles.primaryTab, selected && styles.primaryTabSelected]}>
                <Icon size={22} color="#FFFFFF" />
              </View>
            ) : (
              <Icon size={24} color={selected ? C.tabActive : C.tabInactive} strokeWidth={selected ? 2.4 : 2} />
            )}
            <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.card },
  loginSafeArea: { flex: 1, backgroundColor: C.background },
  main: { flex: 1, backgroundColor: C.background },

  splash: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  splashLogo: { width: 88, height: 88, marginBottom: Spacing.lg },
  splashTitle: { ...Type.title, color: C.text, textAlign: 'center' },
  splashSubtitle: { ...Type.subhead, color: C.textSecondary, marginTop: 4, textAlign: 'center' },
  splashStatus: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xxxl },
  splashStatusText: { ...Type.subhead, color: C.textSecondary },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.tabBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.tabBarBorder,
    paddingTop: 6,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: MinTouchTarget + 6 },
  tabLabel: { fontSize: 11, lineHeight: 13, fontWeight: '500', color: C.tabInactive },
  tabLabelSelected: { color: C.tabActive, fontWeight: '700' },
  primaryTab: {
    width: 44,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  primaryTabSelected: { opacity: 1 },
});
