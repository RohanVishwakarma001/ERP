"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/api/api-error";
import { connectCampusSocket, disconnectCampusSocket } from "@/lib/realtime/campus-socket";
import { attendanceApi } from "./api";
import type { ClassPeriod } from "./types";

interface ScanEvent {
  scannedCount: number;
  studentName: string;
}

/**
 * Runs a faculty QR attendance broadcast for one class period while `active`:
 * fetches a short-lived token, re-issues it as each one expires, and listens on
 * the class's WebSocket room for the live scan tally.
 *
 * State is per hook instance — remount (e.g. via `key`) to start a fresh tally.
 */
export function useQrBroadcast(period: ClassPeriod | null, active: boolean) {
  const [token, setToken] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [lastScanner, setLastScanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const expiresAtRef = useRef<number>(0);

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

  // Token rotation: issue the first token immediately, then a 1s tick drives the
  // countdown and re-issues the token on expiry. (State updates only happen in
  // timer callbacks, never synchronously in the effect body.)
  useEffect(() => {
    if (!active || !period) return;
    const first = setTimeout(rotate, 0);

    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAtRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && expiresAtRef.current > 0) {
        expiresAtRef.current = 0; // prevent duplicate rotations while the request is in flight
        rotate();
      }
    }, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
    };
  }, [active, period, rotate]);

  // Live tally of students who have scanned the current session.
  useEffect(() => {
    if (!active || !period) return;
    const socket = connectCampusSocket();
    const onScan = (event: ScanEvent) => {
      setScannedCount(event.scannedCount);
      setLastScanner(event.studentName);
    };
    socket.emit("join_room", `class_${period.section}`);
    socket.on("qr_scan_received", onScan);
    return () => {
      socket.off("qr_scan_received", onScan);
      disconnectCampusSocket();
    };
  }, [active, period]);

  return { token, secondsLeft, scannedCount, lastScanner, error };
}
