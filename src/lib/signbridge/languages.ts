export type LanguageCode =
  | "en"
  | "hi"
  | "kn"
  | "te"
  | "ta"
  | "ml"
  | "mr"
  | "bn"
  | "gu"
  | "pa";

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  bcp47: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English", bcp47: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", bcp47: "hi-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", bcp47: "kn-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", bcp47: "te-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", bcp47: "ta-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", bcp47: "ml-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", bcp47: "mr-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", bcp47: "bn-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", bcp47: "gu-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", bcp47: "pa-IN" },
];

export function getLanguage(code: LanguageCode): LanguageMeta {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]!;
}