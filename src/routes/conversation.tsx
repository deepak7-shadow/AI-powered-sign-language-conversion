import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Mic, MicOff, Volume2, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/signbridge/AppShell";
import { SignCamera } from "@/components/signbridge/SignCamera";
import { MeaningPanel } from "@/components/signbridge/MeaningPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/signbridge/store";
import { getLanguage } from "@/lib/signbridge/languages";
import { speak, startListening, sttSupported, type Listener } from "@/lib/signbridge/speech";
import { translateText, textToSignSequence } from "@/lib/signbridge/translate";
import { translateMeaning, type SignEntry } from "@/lib/signbridge/vocabulary";
import type { Prediction, RecognitionOutput } from "@/lib/signbridge/recognizer";

export const Route = createFileRoute("/conversation")({
  head: () => ({
    meta: [
      { title: "Conversation mode — SignBridge" },
      {
        name: "description",
        content:
          "Two-way conversation: one person signs to the camera, the other speaks into the microphone, both read the same thread.",
      },
      { property: "og:title", content: "Conversation mode" },
      {
        property: "og:description",
        content: "Signs become spoken sentences, speech becomes text and sign guidance.",
      },
    ],
  }),
  component: Conversation,
});

interface Turn {
  id: string;
  side: "signer" | "speaker";
  text: string;
  translated: string;
  signs?: SignEntry[] | undefined;
  note?: string | undefined;
}

function Conversation() {
  const { prefs, addHistory } = useApp();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [candidates, setCandidates] = useState<Prediction[]>([]);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [typed, setTyped] = useState("");
  const listenerRef = useRef<Listener | null>(null);
  const lang = getLanguage(prefs.language);

  const push = (turn: Omit<Turn, "id">) =>
    setTurns((t) => [...t, { ...turn, id: `${Date.now()}-${Math.random()}` }]);

  const onSignAccepted = (sign: SignEntry, confidence: number, corrected: boolean) => {
    const translated = translateMeaning(sign, prefs.language);
    push({ side: "signer", text: sign.meaning, translated });
    addHistory({
      source: "sign",
      meaning: sign.meaning,
      translated,
      language: prefs.language,
      confidence,
      corrected,
      signId: sign.id,
    });
    setCandidates([]);
  };

  const handleSpokenText = (text: string) => {
    const { text: translated, note } = translateText(text, prefs.language);
    const { signs } = textToSignSequence(text);
    push({ side: "speaker", text, translated, signs, note });
    addHistory({
      source: "voice",
      meaning: text,
      translated,
      language: prefs.language,
    });
  };

  const toggleMic = () => {
    if (listening) {
      listenerRef.current?.stop();
      listenerRef.current = null;
      setListening(false);
      return;
    }
    if (!sttSupported()) {
      toast.error("Speech recognition isn't supported here — type the message instead.");
      return;
    }
    const listener = startListening(prefs.language, {
      onPartial: setPartial,
      onFinal: (text) => {
        setPartial("");
        handleSpokenText(text);
      },
      onError: (message) => {
        toast.error(message);
        setListening(false);
      },
      onEnd: () => {
        setListening(false);
        setPartial("");
      },
    });
    listenerRef.current = listener;
    setListening(Boolean(listener));
  };

  return (
    <AppShell
      title="Conversation mode"
      description="One person signs to the camera, the other speaks into the microphone. Both sides read every message."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sign side</h2>
          <SignCamera
            mirror={prefs.mirrorCamera}
            onResult={(out: RecognitionOutput) => setCandidates(out.candidates)}
          />
          {candidates.length ? (
            <MeaningPanel candidates={candidates} onAccept={onSignAccepted} />
          ) : null}

          <h2 className="pt-2 text-lg font-semibold">Voice side</h2>
          <div className="surface-card space-y-3 p-4">
            <Button
              className="min-h-16 w-full text-base"
              variant={listening ? "destructive" : "default"}
              onClick={toggleMic}
            >
              {listening ? (
                <MicOff className="size-6" aria-hidden />
              ) : (
                <Mic className="size-6" aria-hidden />
              )}
              {listening ? "Stop listening" : `Speak in ${lang.name}`}
            </Button>
            {partial ? (
              <p className="text-sm italic text-muted-foreground" aria-live="polite">
                {partial}…
              </p>
            ) : null}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!typed.trim()) return;
                handleSpokenText(typed.trim());
                setTyped("");
              }}
            >
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="…or type the message"
                className="min-h-12"
                aria-label="Type a spoken message"
              />
              <Button type="submit" className="min-h-12" aria-label="Send message">
                <Send className="size-5" aria-hidden />
              </Button>
            </form>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Conversation</h2>
          <ul className="space-y-3" aria-live="polite">
            {turns.length === 0 ? (
              <li className="surface-card p-5 text-muted-foreground">
                Messages from both sides will appear here.
              </li>
            ) : null}
            {turns.map((turn) => (
              <li
                key={turn.id}
                className={`surface-card p-4 ${
                  turn.side === "signer" ? "border-l-4 border-l-primary" : "border-l-4 border-l-accent"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {turn.side === "signer" ? "Signed" : "Spoken"}
                </p>
                <p className="mt-1 text-lg font-semibold">{turn.text}</p>
                {turn.translated !== turn.text ? (
                  <p className="text-lg text-primary" lang={lang.bcp47}>
                    {turn.translated}
                  </p>
                ) : null}
                {turn.note ? (
                  <p className="mt-1 text-xs text-muted-foreground">{turn.note}</p>
                ) : null}
                {turn.signs?.length ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Sign this back
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {turn.signs.slice(0, 4).map((s) => (
                        <li
                          key={s.id}
                          className="rounded-lg border border-border px-2 py-1 text-sm"
                          title={s.steps.join(" ")}
                        >
                          {s.label.replace(/_/g, " ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <Button
                  variant="ghost"
                  className="mt-2 min-h-11"
                  onClick={() =>
                    void speak(turn.translated, {
                      lang: prefs.language,
                      rate: prefs.speechRate,
                      voiceURI: prefs.voiceURI,
                    }).catch((e: Error) => toast.error(e.message))
                  }
                >
                  <Volume2 className="size-4" aria-hidden />
                  Play aloud
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}