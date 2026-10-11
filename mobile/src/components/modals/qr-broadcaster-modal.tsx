import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Shadows, Spacing } from '@/constants/theme';
import { X, RefreshCw, Users, CheckCircle2, Wifi } from 'lucide-react-native';
import { useQrBroadcast } from '@/features/attendance/use-qr-broadcast';
import type { ClassPeriod } from '@/features/attendance';
import type { FacultyClassItem } from '@/types';

interface QrBroadcasterModalProps {
  /** The class to broadcast for; the modal is hidden when null. */
  classItem: FacultyClassItem | null;
  onClose: () => void;
}

export function QrBroadcasterModal({ classItem, onClose }: QrBroadcasterModalProps) {
  const period = useMemo<ClassPeriod | null>(
    () => (classItem ? { subjectCode: classItem.subjectCode, section: classItem.section, period: classItem.period } : null),
    [classItem],
  );
  const { token, secondsLeft, scannedCount, lastScanner, isLive, error, rotateNow } = useQrBroadcast(period, classItem !== null);
  const totalStudents = classItem?.totalStudents ?? 0;

  return (
    <Modal visible={classItem !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Broadcast Class QR</Text>
              <Text style={styles.subtitle}>
                {classItem?.subjectCode} {classItem?.subjectName} • {classItem?.section} • P{classItem?.period}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.qrDisplayCard}>
            <View style={styles.qrVisualContainer}>
              {token ? (
                <QRCode value={token} size={180} color="#0F172A" backgroundColor="#FFFFFF" />
              ) : (
                <View style={styles.qrLoadingBox}>
                  {error ? <Text style={styles.tokenLabel}>{error}</Text> : <ActivityIndicator size="large" color="#0B3B60" />}
                </View>
              )}
            </View>
            <View style={styles.countdownRow}>
              <View style={styles.countdownPill}>
                <Text style={styles.countdownText}>
                  Token expires in: <Text style={styles.secondsHighlight}>{secondsLeft}s</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={rotateNow} style={styles.refreshIconBtn} accessibilityLabel="Refresh QR">
                <RefreshCw size={14} color="#0B3B60" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tallyCard}>
            <View style={styles.tallyHeader}>
              <View style={styles.tallyIconRow}>
                <Users size={16} color="#0284C7" />
                <Text style={styles.tallyTitle}>Live Scans Received</Text>
              </View>
              <Text style={styles.tallyCount}>
                <Text style={styles.tallyScanned}>{scannedCount}</Text> / {totalStudents || '—'} Students
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${totalStudents > 0 ? Math.min(100, (scannedCount / totalStudents) * 100) : 0}%` }]} />
            </View>
            <View style={styles.geofenceCheckRow}>
              <Wifi size={14} color={isLive ? '#10B981' : '#737378'} />
              <Text style={styles.geofenceNote}>
                {isLive ? (lastScanner ? `Live • Last scan: ${lastScanner}` : 'Live — waiting for scans') : 'Connecting to live scan feed…'}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.finishBtnText}>Done ({scannedCount} scanned)</Text>
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
    borderBottomColor: '#F2F2F7',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 12,
    color: '#636366',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  qrDisplayCard: {
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  qrVisualContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    ...Shadows.md,
  },
  qrLoadingBox: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#C62828',
  },
  refreshIconBtn: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 12,
    color: '#737378',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  tallyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    color: '#1C1C1E',
  },
  tallyCount: {
    fontSize: 12,
    color: '#636366',
  },
  tallyScanned: {
    fontWeight: '800',
    color: '#1F7A45',
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F2F2F7',
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
    fontSize: 12,
    color: '#1F7A45',
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
