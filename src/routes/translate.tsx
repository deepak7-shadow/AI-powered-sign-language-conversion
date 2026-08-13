import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Volume2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/signbridge/AppShell";
import { SignCamera } from "@/components/signbridge/SignCamera";
import { MeaningPanel } from "@/components/signbridge/MeaningPanel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, getLanguage, type LanguageCode } from "@/lib/signbridge/languages";
import { useApp } from "@/lib/signbridge/store";
import { speak } from "@/lib/signbridge/speech";
import { translateMeaning, type SignEntry } from "@/lib/signbridge/vocabulary";
import type { Prediction, RecognitionOutput } from "@/lib/signbridge/recognizer";
import { toast } from "sonner";

export const Route = createFileRoute("/translate")({
  head: () => ({
    meta: [
      { title: "Real-time sign translator — SignBridge" },
      {
        name: "description",
        content:
          "Show a sign to the camera. SignBridge reads the meaning, writes the sentence in your language and speaks it aloud.",
      },
      { property: "og:title", content: "Real-time sign translator" },
      {
        property: "og:description",
        content: "Camera to meaning to translated speech, live on your device.",
      },
    ],
  }),
  component: Translator,
});

function Translator() {
  const { prefs, setPrefs, addHistory } = useApp();
  const [candidates, setCandidates] = useState<Prediction[]>([]);
  const [sentence, setSentence] = useState<SignEntry[]>([]);

  const handleResult = (out: RecognitionOutput) => setCandidates(out.candidates);

  const accept = (sign: SignEntry, confidence: number, corrected: boolean) => {
    setSentence((s) => [...s, sign]);
    addHistory({
      source: "sign",
      meaning: sign.meaning,
      translated: translateMeaning(sign, prefs.language),
      language: prefs.language,
      confidence,
      corrected,
      signId: sign.id,
    });
  };

  const sentenceText = sentence.map((s) => translateMeaning(s, prefs.language)).join(" ");

  return (
    <AppShell
      title="Real-time sign translator"
      description="Show your sign to the camera. Keep both hands inside the frame and sign at a steady pace."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <SignCamera mirror={prefs.mirrorCamera} onResult={handleResult} />
          <p className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
            Prototype recognition: hand tracking is real, but sign labels come from a demo
            heuristic, not a trained ISL model. Always confirm important messages.
          </p>
        </div>

        <div className="space-y-4">
          <div className="surface-card p-4">
            <label className="text-sm font-semibold" htmlFor="lang">
              Show and speak in
            </label>
            <Select
              value={prefs.language}
              onValueChange={(v) => setPrefs({ language: v as LanguageCode })}
            >
              <SelectTrigger id="lang" className="mt-2 min-h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.nativeName} · {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {candidates.length ? (
            <MeaningPanel candidates={candidates} onAccept={accept} />
          ) : (
            <div className="surface-card p-5 text-muted-foreground">
              Recognised meanings will appear here.
            </div>
          )}

          {sentence.length ? (
            <div className="surface-card p-5">
              <h2 className="text-lg font-semibold">Sentence so far</h2>
              <p className="mt-2 text-xl" lang={getLanguage(prefs.language).bcp47}>
                {sentenceText}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="min-h-12"
                  onClick={() =>
                    void speak(sentenceText, {
                      lang: prefs.language,
                      rate: prefs.speechRate,
                      voiceURI: prefs.voiceURI,
                    }).catch((e: Error) => toast.error(e.message))
                  }
                >
                  <Volume2 className="size-5" aria-hidden />
                  Speak sentence
                </Button>
                <Button variant="outline" className="min-h-12" onClick={() => setSentence([])}>
                  <Trash2 className="size-4" aria-hidden />
                  Clear
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}