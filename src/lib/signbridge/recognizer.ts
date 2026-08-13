import { VOCABULARY, type SignEntry } from "./vocabulary";

/** One MediaPipe-style landmark. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

/** One sampled frame of the tracking pipeline. */
export interface LandmarkFrame {
  t: number;
  hands: Landmark[][];
}

export interface Prediction {
  sign: SignEntry;
  confidence: number;
}

export interface RecognitionOutput {
  /** Ranked candidates, best first. */
  candidates: Prediction[];
  /** Feature summary — useful for debugging and for practice feedback. */
  features: SignFeatures;
}

export interface SignFeatures {
  handCount: number;
  extendedFingers: number;
  motion: number;
  verticalPosition: number;
  spread: number;
}

/**
 * The single integration point for sign recognition.
 *
 * Swap `DemoRecognizer` for a `RemoteRecognizer` (FastAPI / TF.js / ONNX)
 * without touching any UI code — see docs/AI-PIPELINE.md.
 */
export interface SignRecognizer {
  readonly id: string;
  readonly displayName: string;
  /** true only for a real trained model. The UI labels demo output clearly. */
  readonly isTrainedModel: boolean;
  warmUp?: () => Promise<void>;
  recognize: (window: LandmarkFrame[]) => Promise<RecognitionOutput | null>;
}

const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_PIPS = [2, 6, 10, 14, 18];

export function extractFeatures(window: LandmarkFrame[]): SignFeatures | null {
  const frames = window.filter((f) => f.hands.length > 0);
  if (frames.length < 4) return null;
  const last = frames[frames.length - 1]!;
  const hand = last.hands[0]!;

  let extended = 0;
  for (let i = 0; i < FINGER_TIPS.length; i++) {
    const tip = hand[FINGER_TIPS[i]!];
    const pip = hand[FINGER_PIPS[i]!];
    if (tip && pip && tip.y < pip.y - 0.02) extended++;
  }

  let motion = 0;
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1]!.hands[0]?.[9];
    const b = frames[i]!.hands[0]?.[9];
    if (a && b) motion += Math.hypot(b.x - a.x, b.y - a.y);
  }
  motion /= Math.max(1, frames.length - 1);

  const xs = hand.map((p) => p.x);
  const ys = hand.map((p) => p.y);
  const spread =
    Math.max(...xs) - Math.min(...xs) + (Math.max(...ys) - Math.min(...ys));

  return {
    handCount: last.hands.length,
    extendedFingers: extended,
    motion: Number(motion.toFixed(4)),
    verticalPosition: Number((hand[9]?.y ?? 0.5).toFixed(3)),
    spread: Number(spread.toFixed(3)),
  };
}

function softmaxish(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp((s - max) * 3));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/**
 * PROTOTYPE recognizer.
 *
 * It scores the curated vocabulary against simple geometric heuristics over
 * MediaPipe hand landmarks (hand count, extended fingers, motion energy,
 * vertical placement). It is a demonstration of the end-to-end pipeline —
 * it is NOT a trained Indian Sign Language model and must never be presented
 * as accurate translation.
 */
export class DemoRecognizer implements SignRecognizer {
  readonly id = "demo-heuristic-v1";
  readonly displayName = "Prototype heuristic recognizer";
  readonly isTrainedModel = false;

  private pool: SignEntry[];

  constructor(pool: SignEntry[] = VOCABULARY) {
    this.pool = pool;
  }

  async recognize(window: LandmarkFrame[]): Promise<RecognitionOutput | null> {
    const features = extractFeatures(window);
    if (!features) return null;

    const scores = this.pool.map((sign, index) => {
      let score = 0;
      score += sign.twoHanded === features.handCount > 1 ? 0.45 : 0;
      const motionBand = features.motion > 0.012 ? 1 : 0;
      score += sign.dynamic === Boolean(motionBand) ? 0.15 : 0;
      // Handshape proxy: spread openness vs. finger count.
      const openness = Math.min(1, features.spread / 0.6);
      score += 1 - Math.abs(openness - (features.extendedFingers / 5)) * 0.6;
      // Stable per-sign jitter derived from the features, so the same gesture
      // repeatedly maps to the same candidate instead of flickering.
      const seed =
        Math.sin(
          (index + 1) *
            (features.extendedFingers * 7.13 +
              features.handCount * 3.7 +
              Math.round(features.verticalPosition * 6) * 2.1 +
              motionBand * 5.9),
        ) * 0.5;
      return score + seed;
    });

    const probs = softmaxish(scores);
    const ranked = this.pool
      .map((sign, i) => ({ sign, confidence: probs[i]! }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    // Keep prototype confidence honest: never report near-certainty.
    const scaled = ranked.map((r, i) => ({
      sign: r.sign,
      confidence: Math.min(0.93, r.confidence * (i === 0 ? 5.5 : 4.2)),
    }));

    return { candidates: scaled, features };
  }
}

/**
 * Adapter for a trained model served over HTTP (FastAPI, TorchServe, …).
 * Point `endpoint` at your inference service and this drops straight in.
 */
export class RemoteRecognizer implements SignRecognizer {
  readonly id = "remote-model";
  readonly displayName = "Trained ISL model (remote)";
  readonly isTrainedModel = true;

  constructor(private endpoint: string) {}

  async recognize(window: LandmarkFrame[]): Promise<RecognitionOutput | null> {
    const features = extractFeatures(window);
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frames: window }),
    });
    if (!res.ok) throw new Error(`Recognition service error (${res.status})`);
    const payload = (await res.json()) as {
      predictions: { label: string; confidence: number }[];
    };
    const candidates = payload.predictions
      .map((p) => {
        const sign = VOCABULARY.find((s) => s.label === p.label);
        return sign ? { sign, confidence: p.confidence } : null;
      })
      .filter((p): p is Prediction => p !== null);
    return { candidates, features: features ?? emptyFeatures() };
  }
}

function emptyFeatures(): SignFeatures {
  return {
    handCount: 0,
    extendedFingers: 0,
    motion: 0,
    verticalPosition: 0,
    spread: 0,
  };
}

export const CONFIDENCE_THRESHOLD = 0.72;