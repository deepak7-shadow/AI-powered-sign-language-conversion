import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Volume2, Copy, Share2, Siren } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/signbridge/AppShell";
import { SignCamera } from "@/components/signbridge/SignCamera";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/signbridge/store";
import { speak } from "@/lib/signbridge/speech";
import { getLanguage } from "@/lib/signbridge/languages";
import { VOCABULARY, translateMeaning } from "@/lib/signbridge/vocabulary";
import type { RecognitionOutput } from "@/lib/signbridge/recognizer";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency mode — SignBridge" },
      {
        name: "description",
        content:
          "One-tap emergency phrases in ten Indian languages, spoken aloud and shown in huge text for hospitals, police and public help.",
      },
      { property: "og:title", content: "Emergency mode" },
      {
        property: "og:description",
        content: "Say 'I need help', 'Call an ambulance' or 'I am deaf' instantly.",
      },
    ],
  }),
  component: Emergency,
});

const URGENT = VOCABULARY.filter(
  (s) => s.category === "emergency" || s.category === "medical",
);

function Emergency() {
  const { prefs, addHistory } = useApp();
  const [big, setBig] = useState<string | null>(null);
  const lang = getLanguage(prefs.language);

  const trigger = (meaning: string, translated: string) => {
    setBig(translated);
    addHistory({
      source: "emergency",
      meaning,
      translated,
      language: prefs.language,
    });
    void speak(translated, {
      lang: prefs.language,
      rate: prefs.speechRate,
      voiceURI: prefs.voiceURI,
    }).catch((e: Error) => toast.error(e.message));
    if (prefs.haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([60, 40, 60]);
    }
  };

  return (
    <AppShell
      title="Emergency mode"
      description="Tap a phrase. It is spoken out loud and shown in very large text so anyone nearby can read it."
    >
      <div
        className="mb-6 flex items-center gap-3 rounded-xl border-2 border-destructive bg-destructive/10 p-4"
        role="note"
      >
        <Siren className="size-6 shrink-0 text-destructive" aria-hidden />
        <p className="text-sm font-semibold">
          For life-threatening emergencies in India call 112 (all-in-one), 108 (ambulance)
          or 100 (police). SignBridge helps you be understood — it does not contact
          services for you.
        </p>
      </div>

      {big ? (
        <div
          className="surface-card mb-6 border-2 border-destructive p-6 text-center"
          aria-live="assertive"
        >
          <p className="font-display text-4xl font-bold sm:text-6xl" lang={lang.bcp47}>
            {big}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              className="min-h-12"
              onClick={() => {
                void globalThis.navigator.clipboard.writeText(big);
                toast.success("Copied");
              }}
            >
              <Copy className="size-4" aria-hidden />
              Copy
            </Button>
            <Button
              variant="outline"
              className="min-h-12"
              onClick={() => {
                const nav: Navigator = globalThis.navigator;
                if (typeof nav.share === "function") {
                  void nav.share({ text: big }).catch(() => undefined);
                  return;
                }
                void nav.clipboard.writeText(big);
                toast.success("Copied to share");
              }}
            >
              <Share2 className="size-4" aria-hidden />
              Share
            </Button>
            <Button variant="ghost" className="min-h-12" onClick={() => setBig(null)}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {URGENT.map((sign) => {
          const translated = translateMeaning(sign, prefs.language);
          return (
            <li key={sign.id}>
              <button
                type="button"
                onClick={() => trigger(sign.meaning, translated)}
                className={`flex min-h-24 w-full flex-col justify-center gap-1 rounded-2xl border-2 p-4 text-left transition-transform active:scale-[0.98] ${
                  sign.category === "emergency"
                    ? "border-destructive bg-destructive/10 hover:bg-destructive/20"
                    : "border-border bg-card hover:border-primary"
                }`}
              >
                <span className="text-xl font-bold">{sign.meaning}</span>
                {prefs.language !== "en" ? (
                  <span className="text-lg text-primary" lang={lang.bcp47}>
                    {translated}
                  </span>
                ) : null}
                <span className="mt-1 flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  <Volume2 className="size-3" aria-hidden /> Tap to speak
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Or sign it</h2>
        <p className="mt-1 text-muted-foreground">
          Emergency signs recognised by the camera are spoken immediately.
        </p>
        <div className="mt-4 max-w-2xl">
          <SignCamera
            mirror={prefs.mirrorCamera}
            onResult={(out: RecognitionOutput) => {
              const top = out.candidates[0];
              if (!top || top.confidence < prefs.confidenceThreshold) return;
              trigger(top.sign.meaning, translateMeaning(top.sign, prefs.language));
            }}
          />
        </div>
      </section>
    </AppShell>
  );
}