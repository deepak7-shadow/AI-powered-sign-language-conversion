import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHandTracking } from "@/lib/signbridge/useHandTracking";
import {
  DemoRecognizer,
  type RecognitionOutput,
  type SignRecognizer,
} from "@/lib/signbridge/recognizer";
import type { SignEntry } from "@/lib/signbridge/vocabulary";

interface Props {
  /** Restrict the candidate pool (used by Practice mode). */
  pool?: SignEntry[];
  autoRecognize?: boolean;
  mirror?: boolean;
  onResult: (output: RecognitionOutput) => void;
  recognizer?: SignRecognizer;
}

export function SignCamera({
  pool,
  autoRecognize = true,
  mirror = true,
  onResult,
  recognizer,
}: Props) {
  const tracking = useHandTracking(mirror);
  const [busy, setBusy] = useState(false);
  const engineRef = useRef<SignRecognizer | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  if (!engineRef.current || recognizer) {
    engineRef.current = recognizer ?? new DemoRecognizer(pool);
  }

  const runOnce = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const win = tracking.getWindow();
    if (win.filter((f) => f.hands.length > 0).length < 6) return;
    setBusy(true);
    try {
      const out = await engine.recognize(win);
      if (out && out.candidates.length) onResultRef.current(out);
    } catch {
      /* surfaced by callers via their own error state */
    } finally {
      setBusy(false);
    }
  }, [tracking]);

  useEffect(() => {
    if (!autoRecognize || tracking.status !== "running") return;
    const id = window.setInterval(() => void runOnce(), 2200);
    return () => window.clearInterval(id);
  }, [autoRecognize, tracking.status, runOnce]);

  const running = tracking.status === "running";

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-secondary">
        <video
          ref={tracking.videoRef}
          playsInline
          muted
          className="size-full object-cover"
          style={{ transform: mirror ? "scaleX(-1)" : undefined }}
        />
        <canvas
          ref={tracking.canvasRef}
          className="pointer-events-none absolute inset-0 size-full"
        />

        {!running ? (
          <div className="absolute inset-0 grid place-items-center bg-secondary/90 p-6 text-center">
            <div>
              <p className="font-display text-xl font-bold">Show your sign to the camera</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Video stays on your device. Nothing is recorded.
              </p>
              <Button
                size="lg"
                className="mt-4 min-h-12 text-base"
                onClick={() => void tracking.start()}
                disabled={tracking.status === "requesting" || tracking.status === "loading"}
              >
                {tracking.status === "loading" || tracking.status === "requesting" ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : (
                  <Camera className="size-5" aria-hidden />
                )}
                {tracking.status === "loading" ? "Loading tracker…" : "Start camera"}
              </Button>
            </div>
          </div>
        ) : null}

        {running ? (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm text-white">
            <span className="rounded-full bg-black/50 px-3 py-1">
              {tracking.handsVisible === 0
                ? "No hands detected"
                : `${tracking.handsVisible} hand${tracking.handsVisible > 1 ? "s" : ""} tracked`}
            </span>
            {busy ? (
              <span className="rounded-full bg-black/50 px-3 py-1">Reading sign…</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {tracking.issue ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          {tracking.issue.message}
        </p>
      ) : null}

      {running ? (
        <div className="flex flex-wrap gap-2">
          {!autoRecognize ? (
            <Button className="min-h-12" onClick={() => void runOnce()} disabled={busy}>
              Read my sign
            </Button>
          ) : null}
          <Button variant="outline" className="min-h-12" onClick={tracking.stop}>
            <CameraOff className="size-4" aria-hidden />
            Stop camera
          </Button>
        </div>
      ) : null}
    </div>
  );
}