import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/api/api-error';
import { connectCampusSocket, disconnectCampusSocket } from '@/lib/realtime/campus-socket';
import { attendanceApi, type ClassPeriod } from './index';

/**
 * Runs a QR attendance broadcast for one class period while `active`: issues a
 * short-lived token, re-issues it on expiry, and listens on the class's socket
 * room for the live scan tally. Mirrors web/src/features/attendance/use-qr-broadcast.ts.
 * State is per hook instance — remount (via `key`) for a fresh tally.
 */
export function useQrBroadcast(period: ClassPeriod | null, active: boolean) {
  const [token, setToken] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [lastScanner, setLastScanner] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expiresAtRef = useRef(0);

  const rotate = useCallback(async () => {
    if (!period) return;
    try {
      const session = await attendanceApi.startQrSession(period);
      setToken(session.qrCodeToken);
      expiresAtRef.current = new Date(session.expiresAt).getTime();
      setError(null);
    } catch (err) {
      setToken(null);
      setError(getErrorMessage(err));
    }
  }, [period]);

  useEffect(() => {
    if (!active || !period) return;
    const first = setTimeout(rotate, 0);
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAtRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && expiresAtRef.current > 0) {
        expiresAtRef.current = 0; // avoid duplicate rotations while the request is in flight
        rotate();
      }
    }, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
    };
  }, [active, period, rotate]);

  useEffect(() => {
    if (!active || !period) return;
    let cancelled = false;
    const onScan = (event: { scannedCount: number; studentName: string }) => {
      setScannedCount(event.scannedCount);
      setLastScanner(event.studentName);
    };
    const onConnect = () => setIsLive(true);
    const onDisconnect = () => setIsLive(false);

    connectCampusSocket().then((socket) => {
      if (cancelled) return;
      socket.emit('join_room', `class_${period.section}`);
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('qr_scan_received', onScan);
    });
    return () => {
      cancelled = true;
      disconnectCampusSocket();
    };
  }, [active, period]);

  return { token, secondsLeft, scannedCount, lastScanner, isLive, error, rotateNow: rotate };
}
