import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react-native';

export function LoginView() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    Keyboard.dismiss();
    setLocalError(null);
    clearError();

    const trimmedId = identifier.trim();
    const trimmedPass = password.trim();

    if (!trimmedId) {
      setLocalError('Please enter your Institutional ID, Roll Number, or Email.');
      return;
    }
    if (!trimmedPass || trimmedPass.length < 4) {
      setLocalError('Password must be at least 4 characters.');
      return;
    }

    const res = await login(trimmedId, trimmedPass);
    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  };

  const handleQuickFill = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setLocalError(null);
    clearError();
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Brand Banner */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>JBIT</Text>
            </View>
            <Text style={styles.institutionName}>JB INSTITUTE OF TECHNOLOGY</Text>
            <Text style={styles.campusLocation}>DEHRADUN • UTTARAKHAND</Text>
            <View style={styles.affiliationRow}>
              <GraduationCap size={13} color="#0284C7" />
              <Text style={styles.affiliationText}>
                Affiliated to VMSB UTU • SDSUV • UBTER • Approved by AICTE
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Enterprise ERP Portal</Text>
              <Text style={styles.formSubtitle}>
                Single Sign-On for Students, Faculty &amp; Academic Staff
              </Text>
            </View>

            {/* Error Notification */}
            {displayError && (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color="#DC2626" style={styles.errorIcon} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {/* Identifier Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>INSTITUTIONAL ID / ROLL NO / EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 220102048 or aarav.sharma@jbitdoon.edu.in"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    if (displayError) {
                      setLocalError(null);
                      clearError();
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  accessibilityLabel="Institutional ID, Roll Number, or Email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your security password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (displayError) {
                      setLocalError(null);
                      clearError();
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Action */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
              accessibilityLabel="Sign In to Campus ERP"
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Authenticating with Server...</Text>
                </View>
              ) : (
                <View style={styles.submitRow}>
                  <Text style={styles.submitBtnText}>Sign In to Campus ERP</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Security Indicator */}
            <View style={styles.securityRow}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.securityText}>
                Encrypted Session • University Identity Node 04
              </Text>
            </View>
          </View>

          {/* Development Quick-Fill Helper (Strictly DEV only, sets form fields for real auth) */}
          {__DEV__ && (
            <View style={styles.devCard}>
              <View style={styles.devHeader}>
                <Sparkles size={13} color="#0B3B60" />
                <Text style={styles.devTitle}>DEV TEST CREDENTIALS (CLICK TO FILL)</Text>
              </View>
              <Text style={styles.devSubtitle}>
                Fills input fields with seeded DB accounts. Always authenticates through backend.
              </Text>
              <View style={styles.devChipsRow}>
                <TouchableOpacity
                  style={styles.devChip}
                  onPress={() =>
                    handleQuickFill('aarav.sharma@jbitdoon.edu.in', 'Jbit@2026')
                  }
                >
                  <Text style={styles.devChipText}>Student: Aarav</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.devChip}
                  onPress={() =>
                    handleQuickFill('hod.cse@jbitdoon.edu.in', 'Jbit@2026')
                  }
                >
                  <Text style={styles.devChipText}>Faculty: Dr. Bhatt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.devChip}
                  onPress={() =>
                    handleQuickFill('registrar@jbitdoon.edu.in', 'Jbit@2026')
                  }
                >
                  <Text style={styles.devChipText}>Admin: Registrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              JBIT CAMPUS AUTOMATION &amp; TELEMATICS SYSTEM
            </Text>
            <Text style={styles.footerVersion}>Release 4.2.0-Prod • Node Dehradun</Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 40 : 28,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#002541',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#0B3B60',
    ...Shadows.md,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 1,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#002541',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  campusLocation: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'center',
  },
  affiliationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  affiliationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369A1',
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  formHeader: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    backgroundColor: '#0B3B60',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  securityText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  devCard: {
    width: '100%',
    maxWidth: 420,
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  devTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0B3B60',
    letterSpacing: 0.5,
  },
  devSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 8,
  },
  devChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  devChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  devChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3B60',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  footerVersion: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
  },
});
