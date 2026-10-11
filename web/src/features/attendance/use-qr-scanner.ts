"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export type ScannerPhase = "idle" | "requesting-camera" | "scanning" | "error";

/**
 * Camera-based QR decoding. Call `start()` to open the rear camera; `onDecode`
 * fires once with the first QR payload found, after which the camera is released.
 * Attach `videoRef` to a <video> and `canvasRef` to a hidden <canvas>.
 */
export function useQrScanner(onDecode: (payload: string) => void) {
  const [phase, setPhase] = useState<ScannerPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const onDecodeRef = useRef(onDecode);
  useEffect(() => {
    onDecodeRef.current = onDecode;
  });

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setPhase("requesting-camera");

    // Decodes one video frame per animation frame until a QR code is found.
    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (video && canvas && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(data, width, height);
        if (code?.data) {
          stop();
          setPhase("idle");
          onDecodeRef.current(code.data);
          return;
        }
      }
      frameRef.current = requestAnimationFrame(scanFrame);
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("scanning");
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setError("Camera access is required to scan QR codes. Please allow camera permission.");
      setPhase("error");
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { phase, error, start, stop, videoRef, canvasRef };
}

/** Best-effort device location for the classroom geofence check. Resolves `{}` if unavailable. */
export function getCurrentLocation(): Promise<{ lat?: number; lng?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}
