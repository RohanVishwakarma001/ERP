import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';
import { Spacing } from '@/constants/theme';
import { X, QrCode, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { attendanceApi } from '@/features/attendance';
import { getErrorMessage } from '@/lib/api/api-error';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (details: string) => void;
}

type ScanState = 'SCANNING' | 'VERIFYING' | 'SUCCESS';

export function QrScannerModal({ visible, onClose, onSuccess }: QrScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('SCANNING');
  const [locationLabel, setLocationLabel] = useState('Acquiring GPS fix...');
  const hasScannedRef = useRef(false);

  // State resets come from remounting (the parent keys this modal on visibility);
  // the effect only has to ask for camera access.
  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (hasScannedRef.current || scanState !== 'SCANNING') return;
    hasScannedRef.current = true;
    setScanState('VERIFYING');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coords: { lat?: number; lng?: number } = {};
      if (status === 'granted') {
        setLocationLabel('Verifying classroom geofence...');
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      } else {
        setLocationLabel('Location permission denied — geofence cannot be verified');
      }

      const res = await attendanceApi.verifyQr(result.data, coords);
      setScanState('SUCCESS');
      setTimeout(() => {
        onSuccess(`${res.subject} marked present`);
        onClose();
      }, 1200);
    } catch (err) {
      hasScannedRef.current = false;
      setScanState('SCANNING');
      Alert.alert('QR attendance failed', getErrorMessage(err));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
                <Text style={styles.subtitle}>Point your camera at the faculty&apos;s live code</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Viewfinder Area */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.reticle}>
              {!permission ? (
                <ActivityIndicator size="large" color="#38BDF8" />
              ) : !permission.granted ? (
                <View style={styles.statusBox}>
                  <Text style={styles.verifyingText}>Camera access is required to scan QR codes.</Text>
                  <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {scanState === 'SCANNING' && (
                    <CameraView
                      style={StyleSheet.absoluteFill}
                      facing="back"
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={handleBarcodeScanned}
                    />
                  )}

                  {/* Corner brackets */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {scanState === 'VERIFYING' ? (
                    <View style={styles.statusBox}>
                      <ActivityIndicator size="large" color="#38BDF8" />
                      <Text style={styles.verifyingText}>Verifying Attendance...</Text>
                      <Text style={styles.tokenSubtext}>{locationLabel}</Text>
                    </View>
                  ) : scanState === 'SUCCESS' ? (
                    <View style={styles.statusBox}>
                      <CheckCircle2 size={48} color="#10B981" />
                      <Text style={styles.successTitle}>Attendance Recorded!</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </View>

          {/* Telemetry info */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryRow}>
              <MapPin size={16} color="#059669" />
              <Text style={styles.telemetryText}>
                GPS geofence checked against the live classroom session
              </Text>
            </View>
            <View style={styles.telemetryRow}>
              <ShieldCheck size={16} color="#0284C7" />
              <Text style={styles.telemetryText}>
                Token rotates every 60s and cannot be reused
              </Text>
            </View>
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
    borderBottomColor: '#F2F2F7',
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
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  reticle: {
    width: 260,
    height: 260,
    backgroundColor: '#1C1C1E',
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
    zIndex: 2,
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
  statusBox: {
    alignItems: 'center',
    padding: 16,
    zIndex: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
  },
  verifyingText: {
    color: '#F2F2F7',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tokenSubtext: {
    color: '#737378',
    fontSize: 12,
    marginTop: 4,
  },
  successTitle: {
    color: '#34D399',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  permissionBtn: {
    marginTop: 14,
    backgroundColor: '#0B3B60',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  telemetryCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryText: {
    fontSize: 12,
    color: '#48484A',
    flex: 1,
  },
});
