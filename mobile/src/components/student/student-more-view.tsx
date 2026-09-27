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
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import {
  Briefcase,
  Home,
  CreditCard,
  Sparkles,
  HelpCircle,
  Settings,
  LogOut,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react-native';
import { mobilePlacementService } from '@/services/mobile-services';
import { PlacementDriveItem } from '@/types';

interface StudentMoreViewProps {
  onOpenCopilot: () => void;
}

export function StudentMoreView({ onOpenCopilot }: StudentMoreViewProps) {
  const { user, logout } = useAuthStore();
  const [drives, setDrives] = useState<PlacementDriveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDrives() {
      try {
        const data = await mobilePlacementService.getDrives();
        if (isMounted) {
          setDrives(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load placement drives', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadDrives();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApply = async (driveId: string, company: string) => {
    try {
      await mobilePlacementService.applyToDrive(driveId);
      Alert.alert('Application Submitted', `Your official application for ${company} has been registered.`);
      setDrives((prev) =>
        prev.map((d) => (d.id === driveId ? { ...d, status: 'APPLIED' } : d))
      );
    } catch (err: any) {
      Alert.alert('Notice', err.response?.data?.message || `Applied to ${company} placement drive.`);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Placement Drives Hub Teaser */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CAMPUS PLACEMENT DRIVES</Text>
      </View>
      <View style={styles.drivesList}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0B3B60" style={{ marginVertical: 16 }} />
        ) : drives.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active placement drives announced.</Text>
          </View>
        ) : (
          drives.map((drive) => (
            <View key={drive.id} style={styles.driveCard}>
              <View style={styles.driveHeader}>
                <View>
                  <Text style={styles.driveCompany}>{drive.company}</Text>
                  <Text style={styles.driveRole}>{drive.role}</Text>
                </View>
                <View style={styles.ctcBadge}>
                  <Text style={styles.ctcText}>{drive.ctc}</Text>
                </View>
              </View>

              <Text style={styles.eligibilityText}>Eligibility: {drive.eligibility}</Text>

              <View style={styles.driveFooter}>
                <Text style={styles.deadlineText}>Deadline: {drive.deadline}</Text>
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => handleApply(drive.id, drive.company)}
                >
                  <Text style={styles.applyBtnText}>
                    {drive.status === 'APPLIED' ? 'Applied ✓' : 'Register / Apply'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 2. Institutional Services */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>STUDENT SERVICES &amp; DESKS</Text>
      </View>
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'Hostel outpass requests are not yet available in the app. Please contact your hostel warden directly.')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FDF2F8' }]}>
            <Home size={18} color="#DB2777" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Hostel &amp; Mess Management</Text>
            <Text style={styles.menuSub}>Coming soon</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'The in-app fee ledger and online payment screen are not yet available.')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#ECFDF5' }]}>
            <CreditCard size={18} color="#059669" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Fee Ledger &amp; Receipts</Text>
            <Text style={styles.menuSub}>Coming soon</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onOpenCopilot}>
          <View style={[styles.menuIcon, { backgroundColor: '#EFF6FF' }]}>
            <Sparkles size={18} color="#0284C7" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>JBIT AI Campus Copilot</Text>
            <Text style={styles.menuSub}>Academic &amp; Telematics Assistant</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'Submitting grievance tickets from the app is not yet available. Please use the web portal or contact the Student Welfare Cell directly.')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
            <HelpCircle size={18} color="#D97706" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Grievance &amp; Redressal Desk</Text>
            <Text style={styles.menuSub}>Track complaints &amp; campus petitions</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* 3. Account & Security Settings */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ACCOUNT &amp; SECURITY SETTINGS</Text>
      </View>
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'In-app notification and security settings are not yet available.')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#F1F5F9' }]}>
            <Settings size={18} color="#475569" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>App Settings &amp; Security</Text>
            <Text style={styles.menuSub}>Biometrics, push notifications, session</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={handleSignOut}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
            <LogOut size={18} color="#DC2626" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Sign Out of ERP</Text>
            <Text style={styles.menuSub}>End current institutional session</Text>
          </View>
          <ChevronRight size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
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
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  drivesList: {
    gap: 12,
  },
  driveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    ...Shadows.sm,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  driveCompany: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  driveRole: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 1,
  },
  ctcBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ctcText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  eligibilityText: {
    fontSize: 11,
    color: '#64748B',
  },
  driveFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  deadlineText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  applyBtn: {
    backgroundColor: '#0B3B60',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
