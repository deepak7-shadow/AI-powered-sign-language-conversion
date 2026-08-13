import type { LanguageCode } from "./languages";
import { VOCABULARY, translateMeaning } from "./vocabulary";

export interface TranslationResult {
  text: string;
  /** true when the phrase came from the built-in offline ISL phrase table. */
  offline: boolean;
  note?: string;
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.!?,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Offline phrase translation.
 *
 * This resolves against the curated ISL phrase table shipped with the app.
 * Free-form sentences require an online machine-translation provider — see
 * docs/AI-PIPELINE.md for the adapter interface.
 */
export function translateText(text: string, lang: LanguageCode): TranslationResult {
  if (lang === "en") return { text, offline: true };
  const key = normalise(text);
  const hit = VOCABULARY.find(
    (s) => normalise(s.meaning) === key || normalise(s.label.replace(/_/g, " ")) === key,
  );
  if (hit) return { text: translateMeaning(hit, lang), offline: true };
  return {
    text,
    offline: false,
    note: "Shown in English — this phrase is not in the offline table yet. Connect a machine-translation provider for free-form sentences.",
  };
}

/** Maps spoken/typed text to the sign glosses that represent it. */
export function textToSignSequence(text: string) {
  const key = normalise(text);
  const exact = VOCABULARY.find((s) => normalise(s.meaning) === key);
  if (exact) return { signs: [exact], exact: true };
  const words = key.split(" ");
  const signs = VOCABULARY.filter((s) => {
    const tokens = normalise(s.label.replace(/_/g, " ")).split(" ");
    return tokens.some((tok) => words.includes(tok));
  });
  return { signs, exact: false };
}