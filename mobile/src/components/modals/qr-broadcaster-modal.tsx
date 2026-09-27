import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { X, RefreshCw, Users, ShieldAlert, CheckCircle2, Wifi } from 'lucide-react-native';

import { mobileFacultyService } from '@/services/mobile-services';

interface QrBroadcasterModalProps {
  visible: boolean;
  onClose: () => void;
  classNameTitle?: string;
  section?: string;
}

export function QrBroadcasterModal({
  visible,
  onClose,
  classNameTitle = 'CS-801 Distributed Systems',
  section = 'CSE-8B',
}: QrBroadcasterModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [scannedCount, setScannedCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(60);
  const [qrToken, setQrToken] = useState('JBIT-SECURE-QR-SESSION-CONNECTING');

  const fetchTokenFromBackend = async () => {
    try {
      const res = await mobileFacultyService.generateClassQr({
        classId: 'CS-801',
        subjectCode: 'CS-801',
        section,
        period: 2,
      });
      if (res?.qrCode || res?.qrCodeToken) {
        setQrToken(res.qrCode || res.qrCodeToken);
        setSecondsLeft(res.expiresInSeconds || 60);
      }
    } catch (err) {
      console.error('Failed to generate class QR session', err);
    }
  };

  useEffect(() => {
    if (!visible) return;

    fetchTokenFromBackend();

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchTokenFromBackend();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [visible, section]);

  const handleManualRefresh = () => {
    fetchTokenFromBackend();
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
            <View>
              <Text style={styles.title}>Broadcast Class QR</Text>
              <Text style={styles.subtitle}>{classNameTitle} • {section}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* QR Display Card */}
          <View style={styles.qrDisplayCard}>
            {/* Mock QR matrix visualization with high-tech look */}
            <View style={styles.qrVisualContainer}>
              <View style={styles.mockQrMatrix}>
                <View style={styles.qrCornerMark} />
                <View style={[styles.qrCornerMark, { right: 8, left: undefined }]} />
                <View style={[styles.qrCornerMark, { bottom: 8, top: undefined }]} />
                <View style={styles.qrCenterPill}>
                  <Text style={styles.qrCenterText}>JBIT</Text>
                </View>
                {/* Visual grid dots */}
                <View style={styles.dotsRow}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
                <View style={[styles.dotsRow, { top: 80 }]}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            </View>

            {/* Countdown timer pill */}
            <View style={styles.countdownRow}>
              <View style={styles.countdownPill}>
                <Text style={styles.countdownText}>
                  Token expires in: <Text style={styles.secondsHighlight}>{secondsLeft}s</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshIconBtn}>
                <RefreshCw size={14} color="#0B3B60" />
              </TouchableOpacity>
            </View>

            <Text style={styles.tokenLabel}>Token ID: {qrToken}</Text>
          </View>

          {/* Live Attendance Counter */}
          <View style={styles.tallyCard}>
            <View style={styles.tallyHeader}>
              <View style={styles.tallyIconRow}>
                <Users size={16} color="#0284C7" />
                <Text style={styles.tallyTitle}>Live Scans Received</Text>
              </View>
              <Text style={styles.tallyCount}>
                <Text style={styles.tallyScanned}>{scannedCount}</Text> / {totalStudents} Students
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(scannedCount / totalStudents) * 100}%` },
                ]}
              />
            </View>

            <View style={styles.geofenceCheckRow}>
              <Wifi size={14} color="#10B981" />
              <Text style={styles.geofenceNote}>Campus Wi-Fi & Geofence Active (Audi-02)</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.finishBtnText}>Finish & Lock Session ({scannedCount} Present)</Text>
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
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  qrDisplayCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrVisualContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    ...Shadows.md,
  },
  mockQrMatrix: {
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0F172A',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCornerMark: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 36,
    height: 36,
    backgroundColor: '#002541',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  qrCenterPill: {
    backgroundColor: '#BB0112',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qrCenterText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
  dotsRow: {
    position: 'absolute',
    top: 54,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#0F172A',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  countdownPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countdownText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  secondsHighlight: {
    fontWeight: '800',
    color: '#DC2626',
  },
  refreshIconBtn: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  tallyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  tallyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tallyIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tallyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tallyCount: {
    fontSize: 12,
    color: '#64748B',
  },
  tallyScanned: {
    fontWeight: '800',
    color: '#10B981',
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  geofenceCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  geofenceNote: {
    fontSize: 11,
    color: '#059669',
  },
  actionRow: {
    marginTop: Spacing.lg,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B3B60',
    paddingVertical: 14,
    borderRadius: 12,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
