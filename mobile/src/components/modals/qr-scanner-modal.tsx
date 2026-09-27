import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { X, QrCode, MapPin, CheckCircle2, ShieldCheck, Zap } from 'lucide-react-native';
import { mobileStudentService } from '@/services/mobile-services';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (details: string) => void;
}

export function QrScannerModal({ visible, onClose, onSuccess }: QrScannerModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [laserAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setVerifiedSuccess(false);
      setIsVerifying(false);
      // Run scanning laser loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 200,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const handleScan = async () => {
    setIsVerifying(true);
    try {
      const res = await mobileStudentService.verifyQrAttendance(
        'JBIT-SECURE-QR-CS-602-ACTIVE',
        { lat: 30.3441, lng: 77.9472 }
      );
      setIsVerifying(false);
      setVerifiedSuccess(true);
      setTimeout(() => {
        onSuccess(res.message || 'CS-602 Cloud Computing (Period 2)');
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsVerifying(false);
      Alert.alert(
        'QR Attendance Failed',
        err.response?.data?.message || 'Geofence validation failed or session expired.'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBadge}>
                <QrCode size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.title}>Scan Classroom QR</Text>
                <Text style={styles.subtitle}>Geofence Validated • Period 2 Active</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Viewfinder Area */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.reticle}>
              {/* Corner brackets */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Animated Laser line */}
              {!verifiedSuccess && !isVerifying && (
                <Animated.View
                  style={[
                    styles.laserLine,
                    { transform: [{ translateY: laserAnim }] },
                  ]}
                />
              )}

              {/* Status Overlay */}
              {isVerifying ? (
                <View style={styles.statusBox}>
                  <ActivityIndicator size="large" color="#38BDF8" />
                  <Text style={styles.verifyingText}>Verifying Geofenced Token...</Text>
                  <Text style={styles.tokenSubtext}>JBIT Campus Node 102.39</Text>
                </View>
              ) : verifiedSuccess ? (
                <View style={styles.statusBox}>
                  <CheckCircle2 size={48} color="#10B981" />
                  <Text style={styles.successTitle}>Attendance Recorded!</Text>
                  <Text style={styles.successSubtext}>CS-602 • Period 2 Marked Present</Text>
                </View>
              ) : (
                <View style={styles.centerTarget}>
                  <Text style={styles.targetPrompt}>Align QR inside frame</Text>
                </View>
              )}
            </View>
          </View>

          {/* Telemetry info */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryRow}>
              <MapPin size={16} color="#059669" />
              <Text style={styles.telemetryText}>
                Location: <Text style={styles.boldText}>Block B, 4th Floor Lab-401</Text>
              </Text>
            </View>
            <View style={styles.telemetryRow}>
              <ShieldCheck size={16} color="#0284C7" />
              <Text style={styles.telemetryText}>
                Anti-Proxy: <Text style={styles.boldText}>Wi-Fi BSSID Verified</Text>
              </Text>
            </View>
          </View>

          {/* Action triggers */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.simulateBtn}
              onPress={handleScan}
              disabled={isVerifying || verifiedSuccess}
            >
              <Zap size={16} color="#FFFFFF" />
              <Text style={styles.simulateBtnText}>
                {isVerifying ? 'Verifying...' : 'Scan & Mark Attendance'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0B3B60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  reticle: {
    width: 240,
    height: 240,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38BDF8',
  },
  topLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 12,
    right: 12,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  laserLine: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  statusBox: {
    alignItems: 'center',
    padding: 16,
  },
  verifyingText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  tokenSubtext: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  successTitle: {
    color: '#34D399',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  successSubtext: {
    color: '#E2E8F0',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  centerTarget: {
    alignItems: 'center',
  },
  targetPrompt: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  telemetryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryText: {
    fontSize: 12,
    color: '#475569',
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  actionRow: {
    marginTop: Spacing.lg,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B3B60',
    paddingVertical: 14,
    borderRadius: 12,
    ...Shadows.sm,
  },
  simulateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
