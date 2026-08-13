import { getLanguage, type LanguageCode } from "./languages";

export interface SpeakOptions {
  lang: LanguageCode;
  rate?: number;
  voiceURI?: string | null;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/** Speaks text with the browser's TTS engine. Resolves when speech ends. */
export function speak(text: string, opts: SpeakOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!speechSupported()) {
      reject(new Error("Text-to-speech is not available in this browser."));
      return;
    }
    const meta = getLanguage(opts.lang);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = meta.bcp47;
    utter.rate = opts.rate ?? 1;
    const voices = listVoices();
    const chosen =
      (opts.voiceURI && voices.find((v) => v.voiceURI === opts.voiceURI)) ||
      voices.find((v) => v.lang.replace("_", "-") === meta.bcp47) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(opts.lang));
    if (chosen) utter.voice = chosen;
    utter.onend = () => resolve();
    utter.onerror = () =>
      reject(new Error(`No voice available for ${meta.name} on this device.`));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  });
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export function hasVoiceFor(lang: LanguageCode): boolean {
  return listVoices().some((v) => v.lang.toLowerCase().startsWith(lang));
}

/* ------------------------------------------------------------------ */
/* Speech recognition (voice → text)                                   */
/* ------------------------------------------------------------------ */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

export function sttSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export interface Listener {
  stop: () => void;
}

export function startListening(
  lang: LanguageCode,
  handlers: {
    onPartial?: (text: string) => void;
    onFinal: (text: string) => void;
    onError: (message: string) => void;
    onEnd?: () => void;
  },
): Listener | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    handlers.onError(
      "Speech recognition is not supported in this browser. Try Chrome, or type instead.",
    );
    return null;
  }
  const rec = new Ctor();
  rec.lang = getLanguage(lang).bcp47;
  rec.continuous = false;
  rec.interimResults = true;
  rec.onresult = (event: any) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0]?.transcript ?? "";
      if (result.isFinal) {
        if (transcript.trim()) handlers.onFinal(transcript.trim());
      } else {
        interim += transcript;
      }
    }
    if (interim && handlers.onPartial) handlers.onPartial(interim);
  };
  rec.onerror = (e: any) => {
    const code = e?.error as string | undefined;
    const message =
      code === "not-allowed"
        ? "Microphone permission was denied. Enable it in your browser settings."
        : code === "no-speech"
          ? "I didn't hear anything. Please try speaking again."
          : code === "network"
            ? "Speech recognition needs an internet connection."
            : "Microphone error. Please try again.";
    handlers.onError(message);
  };
  rec.onend = () => handlers.onEnd?.();
  try {
    rec.start();
  } catch {
    handlers.onError("Could not start the microphone.");
    return null;
  }
  return { stop: () => rec.stop() };
}