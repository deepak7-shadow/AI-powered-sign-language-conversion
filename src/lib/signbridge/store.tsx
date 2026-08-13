import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LanguageCode } from "./languages";

export interface HistoryItem {
  id: string;
  at: number;
  source: "sign" | "voice" | "text" | "emergency";
  meaning: string;
  translated: string;
  language: LanguageCode;
  confidence?: number;
  corrected?: boolean;
  signId?: string;
}

export interface CorrectionItem {
  id: string;
  at: number;
  predictedSignId: string;
  actualSignId: string;
  confidence: number;
}

export interface Preferences {
  onboarded: boolean;
  name: string;
  language: LanguageCode;
  signLanguage: "ISL" | "ASL";
  theme: "light" | "dark" | "system";
  textScale: number;
  speechRate: number;
  voiceURI: string | null;
  autoSpeak: boolean;
  haptics: boolean;
  captions: boolean;
  saveHistory: boolean;
  storeLandmarksOnly: boolean;
  allowRecording: boolean;
  confidenceThreshold: number;
  mirrorCamera: boolean;
}

export interface AppState {
  prefs: Preferences;
  favorites: string[];
  history: HistoryItem[];
  corrections: CorrectionItem[];
  practice: Record<string, { attempts: number; correct: number }>;
}

const DEFAULT_STATE: AppState = {
  prefs: {
    onboarded: false,
    name: "",
    language: "en",
    signLanguage: "ISL",
    theme: "system",
    textScale: 1,
    speechRate: 1,
    voiceURI: null,
    autoSpeak: true,
    haptics: true,
    captions: true,
    saveHistory: true,
    storeLandmarksOnly: true,
    allowRecording: false,
    confidenceThreshold: 0.72,
    mirrorCamera: true,
  },
  favorites: [],
  history: [],
  corrections: [],
  practice: {},
};

const STORAGE_KEY = "signbridge.state.v1";

interface Ctx extends AppState {
  ready: boolean;
  setPrefs: (patch: Partial<Preferences>) => void;
  addHistory: (item: Omit<HistoryItem, "id" | "at">) => void;
  clearHistory: () => void;
  removeHistory: (id: string) => void;
  toggleFavorite: (signId: string) => void;
  addCorrection: (item: Omit<CorrectionItem, "id" | "at">) => void;
  recordPractice: (signId: string, correct: boolean) => void;
  resetAll: () => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        setState({
          ...DEFAULT_STATE,
          ...parsed,
          prefs: { ...DEFAULT_STATE.prefs, ...(parsed.prefs ?? {}) },
        });
      }
    } catch {
      /* corrupted storage — fall back to defaults */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked */
    }
  }, [state, ready]);

  // Theme + text size are applied to the document root.
  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark =
      state.prefs.theme === "dark" || (state.prefs.theme === "system" && prefersDark);
    root.classList.toggle("dark", dark);
    root.style.setProperty("--text-scale", String(state.prefs.textScale));
  }, [ready, state.prefs.theme, state.prefs.textScale]);

  const setPrefs = useCallback((patch: Partial<Preferences>) => {
    setState((s) => ({ ...s, prefs: { ...s.prefs, ...patch } }));
  }, []);

  const addHistory = useCallback((item: Omit<HistoryItem, "id" | "at">) => {
    setState((s) => {
      if (!s.prefs.saveHistory) return s;
      const entry: HistoryItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: Date.now(),
      };
      return { ...s, history: [entry, ...s.history].slice(0, 300) };
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      ready,
      setPrefs,
      addHistory,
      clearHistory: () => setState((s) => ({ ...s, history: [] })),
      removeHistory: (id) =>
        setState((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) })),
      toggleFavorite: (signId) =>
        setState((s) => ({
          ...s,
          favorites: s.favorites.includes(signId)
            ? s.favorites.filter((f) => f !== signId)
            : [...s.favorites, signId],
        })),
      addCorrection: (item) =>
        setState((s) => ({
          ...s,
          corrections: [
            {
              ...item,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              at: Date.now(),
            },
            ...s.corrections,
          ].slice(0, 200),
        })),
      recordPractice: (signId, correct) =>
        setState((s) => {
          const cur = s.practice[signId] ?? { attempts: 0, correct: 0 };
          return {
            ...s,
            practice: {
              ...s.practice,
              [signId]: {
                attempts: cur.attempts + 1,
                correct: cur.correct + (correct ? 1 : 0),
              },
            },
          };
        }),
      resetAll: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setState(DEFAULT_STATE);
      },
    }),
    [state, ready, setPrefs, addHistory],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

export function vibrate(pattern: number | number[], enabled: boolean) {
  if (!enabled) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}