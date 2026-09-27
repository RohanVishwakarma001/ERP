import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Shadows, Spacing } from '@/constants/theme';
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
import { QrScannerModal } from '@/components/modals/qr-scanner-modal';
import { QrBroadcasterModal } from '@/components/modals/qr-broadcaster-modal';
import { AiCopilotModal } from '@/components/modals/ai-copilot-modal';
import {
  Home,
  BookOpen,
  QrCode,
  Calendar,
  Layers,
  Award,
  CheckCheck,
} from 'lucide-react-native';

export default function MobileAppRoot() {
  const { user, authStatus, restoreSession } = useAuthStore();
  const isFaculty = user?.role === 'FACULTY' || user?.role === 'HOD';

  // Navigation tab state
  const [studentTab, setStudentTab] = useState<'home' | 'academics' | 'attendance' | 'schedule' | 'more'>('home');
  const [facultyTab, setFacultyTab] = useState<'home' | 'attendance' | 'marks' | 'timetable' | 'more'>('home');

  // Modals state
  const [scannerVisible, setScannerVisible] = useState(false);
  const [broadcasterVisible, setBroadcasterVisible] = useState(false);
  const [copilotVisible, setCopilotVisible] = useState(false);

  // Restore authenticated session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Android Hardware Back Button Handling with modal and deep stack prioritization
  useEffect(() => {
    const onBackPress = () => {
      // 1. Modals take top priority: close modal and intercept back action
      if (copilotVisible) {
        setCopilotVisible(false);
        return true;
      }
      if (scannerVisible) {
        setScannerVisible(false);
        return true;
      }
      if (broadcasterVisible) {
        setBroadcasterVisible(false);
        return true;
      }

      // 2. Subtab screens: return to root home tab
      if (isFaculty && facultyTab !== 'home') {
        setFacultyTab('home');
        return true;
      }
      if (!isFaculty && studentTab !== 'home') {
        setStudentTab('home');
        return true;
      }

      // 3. At root home: allow native exit/minimize behavior without jumping to login
      return false;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [copilotVisible, scannerVisible, broadcasterVisible, isFaculty, facultyTab, studentTab]);

  const handleOpenNotifications = () => {
    Alert.alert(
      'Campus Notifications',
      '1. UTU Practical Exam Schedule Published (Starts June 2)\n2. Infosys SpringBoard Registration Open\n3. Library Book Due: Operating System Concepts (Due May 30)'
    );
  };

  // 1. Splash / Loading Screen during session check
  if (authStatus === 'loading') {
    return (
      <SafeAreaView style={styles.splashSafeArea}>
        <View style={styles.splashContainer}>
          <View style={styles.splashLogoBadge}>
            <Text style={styles.splashLogoText}>JBIT</Text>
          </View>
          <Text style={styles.splashTitle}>JB INSTITUTE OF TECHNOLOGY</Text>
          <Text style={styles.splashSubtitle}>CAMPUS ERP ECOSYSTEM</Text>
          <View style={styles.splashSpinnerRow}>
            <ActivityIndicator size="small" color="#0B3B60" />
            <Text style={styles.splashStatusText}>Restoring secure session...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Unauthenticated state: Institutional Login
  if (authStatus === 'unauthenticated' || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoginView />
      </SafeAreaView>
    );
  }

  // 3. Authenticated App Flow: Role determined strictly from backend
  const activeTab = isFaculty ? facultyTab : studentTab;
  const canGoBack = activeTab !== 'home';
  const handleBack = () => {
    if (isFaculty) {
      setFacultyTab('home');
    } else {
      setStudentTab('home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Institutional Top Bar with Back affordance on sub-pages */}
        <AppHeader
          canGoBack={canGoBack}
          onBack={handleBack}
          title={isFaculty ? 'Console' : 'Dashboard'}
          onOpenCopilot={() => setCopilotVisible(true)}
          onOpenNotifications={handleOpenNotifications}
        />

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {isFaculty ? (
            <>
              {facultyTab === 'home' && (
                <FacultyHomeView
                  onOpenBroadcaster={() => setBroadcasterVisible(true)}
                  onNavigateTab={(tab) => setFacultyTab(tab as any)}
                />
              )}
              {facultyTab === 'attendance' && (
                <FacultyAttendanceView
                  onOpenBroadcaster={() => setBroadcasterVisible(true)}
                />
              )}
              {facultyTab === 'marks' && <FacultyMarksView />}
              {facultyTab === 'timetable' && <FacultyTimetableView />}
              {facultyTab === 'more' && (
                <FacultyMoreView
                  onOpenCopilot={() => setCopilotVisible(true)}
                />
              )}
            </>
          ) : (
            <>
              {studentTab === 'home' && (
                <StudentHomeView
                  onOpenQrScanner={() => setScannerVisible(true)}
                  onOpenCopilot={() => setCopilotVisible(true)}
                  onNavigateTab={(tab) => setStudentTab(tab as any)}
                />
              )}
              {studentTab === 'academics' && <StudentAcademicsView />}
              {studentTab === 'attendance' && (
                <StudentAttendanceView
                  onOpenQrScanner={() => setScannerVisible(true)}
                />
              )}
              {studentTab === 'schedule' && <StudentScheduleView />}
              {studentTab === 'more' && (
                <StudentMoreView
                  onOpenCopilot={() => setCopilotVisible(true)}
                />
              )}
            </>
          )}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.bottomTabBar}>
          {isFaculty ? (
            <>
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setFacultyTab('home')}
                accessibilityLabel="Faculty Console tab"
              >
                <Home
                  size={20}
                  color={facultyTab === 'home' ? '#0B3B60' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    facultyTab === 'home' && styles.activeTabLabel,
                  ]}
                >
                  Console
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setFacultyTab('attendance')}
                accessibilityLabel="Faculty Attendance tab"
              >
                <CheckCheck
                  size={20}
                  color={facultyTab === 'attendance' ? '#0B3B60' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    facultyTab === 'attendance' && styles.activeTabLabel,
                  ]}
                >
                  Attendance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setFacultyTab('marks')}
                accessibilityLabel="Faculty Marks tab"
              >
                <Award
                  size={20}
                  color={facultyTab === 'marks' ? '#0B3B60' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    facultyTab === 'marks' && styles.activeTabLabel,
                  ]}
                >
                  Marks
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setFacultyTab('timetable')}
                accessibilityLabel="Faculty Schedule tab"
              >
                <Calendar
                  size={20}
                  color={facultyTab === 'timetable' ? '#0B3B60' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    facultyTab === 'timetable' && styles.activeTabLabel,
                  ]}
                >
                  Schedule
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setFacultyTab('more')}
                accessibilityLabel="Faculty More options tab"
              >
                <Layers
                  size={20}
                  color={facultyTab === 'more' ? '#0B3B60' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    facultyTab === 'more' && styles.activeTabLabel,
                  ]}
                >
                  More
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setStudentTab('home')}
                accessibilityLabel="Student Home tab"
              >
                <Home
                  size={20}
                  color={studentTab === 'home' ? '#0B3B60' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    studentTab === 'home' && styles.activeTabLabel,
                  ]}
                >
                  Home
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setStudentTab('academics')}
                accessibilityLabel="Student Academics tab"
              >
                <BookOpen
                  size={20}
                  color={studentTab === 'academics' ? '#0B3B60' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    studentTab === 'academics' && styles.activeTabLabel,
                  ]}
                >
                  Academics
                </Text>
              </TouchableOpacity>

              {/* Center Prominent Attendance Tab */}
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setStudentTab('attendance')}
                accessibilityLabel="Student QR Attendance tab"
              >
                <View style={styles.centerTabBadge}>
                  <QrCode size={20} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    studentTab === 'attendance' && styles.activeTabLabel,
                  ]}
                >
                  Attendance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setStudentTab('schedule')}
                accessibilityLabel="Student Schedule tab"
              >
                <Calendar
                  size={20}
                  color={studentTab === 'schedule' ? '#0B3B60' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    studentTab === 'schedule' && styles.activeTabLabel,
                  ]}
                >
                  Schedule
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setStudentTab('more')}
                accessibilityLabel="Student More options tab"
              >
                <Layers
                  size={20}
                  color={studentTab === 'more' ? '#0B3B60' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    studentTab === 'more' && styles.activeTabLabel,
                  ]}
                >
                  More
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Global Modals */}
        <QrScannerModal
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onSuccess={(detail) => {
            Alert.alert('Verified', `Attendance marked for: ${detail}`);
          }}
        />

        <QrBroadcasterModal
          visible={broadcasterVisible}
          onClose={() => setBroadcasterVisible(false)}
        />

        <AiCopilotModal
          visible={copilotVisible}
          onClose={() => setCopilotVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  splashSafeArea: {
    flex: 1,
    backgroundColor: '#002541',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  splashLogoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#002541',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Shadows.lg,
  },
  splashLogoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 24,
    letterSpacing: 1,
  },
  splashTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#002541',
    letterSpacing: 1,
    textAlign: 'center',
  },
  splashSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    marginTop: 4,
    textAlign: 'center',
  },
  splashSpinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  splashStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B3B60',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainContent: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    ...Shadows.md,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeTabLabel: {
    color: '#0B3B60',
    fontWeight: '800',
  },
  centerTabBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#002541',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    ...Shadows.sm,
  },
});
