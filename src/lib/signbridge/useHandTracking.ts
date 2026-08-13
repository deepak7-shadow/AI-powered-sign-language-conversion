import { useCallback, useEffect, useRef, useState } from "react";
import type { LandmarkFrame } from "./recognizer";

const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type TrackingStatus =
  | "idle"
  | "requesting"
  | "loading"
  | "running"
  | "error";

export interface TrackingIssue {
  code:
    | "permission"
    | "no-camera"
    | "model"
    | "no-hands"
    | "out-of-frame"
    | "dark"
    | "multiple-people"
    | "unknown";
  message: string;
}

export interface UseHandTracking {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: TrackingStatus;
  issue: TrackingIssue | null;
  handsVisible: number;
  start: () => Promise<void>;
  stop: () => void;
  /** Rolling window of the last ~2s of landmark frames. */
  getWindow: () => LandmarkFrame[];
  clearWindow: () => void;
}

const WINDOW_MS = 2000;

export function useHandTracking(mirror = true): UseHandTracking {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const windowRef = useRef<LandmarkFrame[]>([]);
  const [status, setStatus] = useState<TrackingStatus>("idle");
  const [issue, setIssue] = useState<TrackingIssue | null>(null);
  const [handsVisible, setHandsVisible] = useState(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    windowRef.current = [];
    setHandsVisible(0);
    setStatus("idle");
  }, []);

  useEffect(() => stop, [stop]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    let result: any = null;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch {
      /* transient decode error — skip this frame */
    }
    const hands: { x: number; y: number; z: number }[][] =
      result?.landmarks?.map((h: any[]) =>
        h.map((p) => ({ x: p.x, y: p.y, z: p.z })),
      ) ?? [];

    const now = performance.now();
    windowRef.current.push({ t: now, hands });
    windowRef.current = windowRef.current.filter((f) => now - f.t < WINDOW_MS);
    setHandsVisible(hands.length);

    if (hands.length === 0) {
      setIssue((cur) =>
        cur?.code === "permission" || cur?.code === "model"
          ? cur
          : { code: "no-hands", message: "Show your sign to the camera." },
      );
    } else {
      const outOfFrame = hands.some((h) =>
        h.some((p) => p.x < 0.02 || p.x > 0.98 || p.y < 0.02 || p.y > 0.98),
      );
      setIssue(
        outOfFrame
          ? {
              code: "out-of-frame",
              message: "Move back a little — your hands are leaving the frame.",
            }
          : null,
      );
    }

    // Landmark overlay
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        if (mirror) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.fillStyle = "#38bdf8";
        ctx.strokeStyle = "rgba(56,189,248,0.6)";
        ctx.lineWidth = 2;
        for (const hand of hands) {
          for (const p of hand) {
            ctx.beginPath();
            ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          const chains = [
            [0, 1, 2, 3, 4],
            [0, 5, 6, 7, 8],
            [0, 9, 10, 11, 12],
            [0, 13, 14, 15, 16],
            [0, 17, 18, 19, 20],
          ];
          for (const chain of chains) {
            ctx.beginPath();
            chain.forEach((idx, i) => {
              const p = hand[idx];
              if (!p) return;
              const x = p.x * canvas.width;
              const y = p.y * canvas.height;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [mirror]);

  const start = useCallback(async () => {
    if (status === "running") return;
    setIssue(null);
    setStatus("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 } },
        audio: false,
      });
    } catch (err) {
      const name = (err as DOMException)?.name;
      setStatus("error");
      setIssue({
        code: name === "NotFoundError" ? "no-camera" : "permission",
        message:
          name === "NotFoundError"
            ? "No camera was found on this device."
            : "Camera permission is needed to read signs. Allow it in your browser and try again.",
      });
      return;
    }
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => undefined);
    }

    setStatus("loading");
    try {
      if (!landmarkerRef.current) {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_ROOT);
        landmarkerRef.current = await vision.HandLandmarker.createFromOptions(
          fileset,
          {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 2,
          },
        );
      }
    } catch {
      setStatus("error");
      setIssue({
        code: "model",
        message:
          "The hand-tracking model could not load. Check your internet connection and try again.",
      });
      return;
    }

    setStatus("running");
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, status]);

  return {
    videoRef,
    canvasRef,
    status,
    issue,
    handsVisible,
    start,
    stop,
    getWindow: () => windowRef.current.slice(),
    clearWindow: () => {
      windowRef.current = [];
    },
  };
}