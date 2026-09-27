import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import {
  FileText,
  Calendar,
  Sparkles,
  Settings,
  LogOut,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';

interface FacultyMoreViewProps {
  onOpenCopilot: () => void;
}

export function FacultyMoreView({ onOpenCopilot }: FacultyMoreViewProps) {
  const { user, logout } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your faculty session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Departmental Admin Tools */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ACADEMIC &amp; HOD TOOLS</Text>
      </View>
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'Leave and on-duty applications are not yet available in the app. Please use the web portal.')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#EFF6FF' }]}>
            <Calendar size={18} color="#0284C7" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Leave &amp; On-Duty Applications</Text>
            <Text style={styles.menuSub}>Coming soon</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'Reviewing student attendance petitions in the app is not yet available. Please use the web portal.')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
            <FileText size={18} color="#D97706" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Student Attendance Petitions</Text>
            <Text style={styles.menuSub}>Coming soon</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onOpenCopilot}>
          <View style={[styles.menuIcon, { backgroundColor: '#FDF4FF' }]}>
            <Sparkles size={18} color="#A855F7" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>JBIT Faculty AI Copilot</Text>
            <Text style={styles.menuSub}>Curriculum, lesson plans &amp; moderation</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* 2. Security & Credentials */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SECURITY &amp; CREDENTIALS</Text>
      </View>
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'In-app security settings are not yet available.')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#F1F5F9' }]}>
            <Settings size={18} color="#475569" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Faculty Security &amp; Keys</Text>
            <Text style={styles.menuSub}>Digital signature, 2FA, biometric auth</Text>
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
            <Text style={styles.menuSub}>End current faculty session</Text>
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
});
