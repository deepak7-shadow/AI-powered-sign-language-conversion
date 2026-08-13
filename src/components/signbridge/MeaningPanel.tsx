import { useState } from "react";
import { Volume2, Star, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, vibrate } from "@/lib/signbridge/store";
import { speak } from "@/lib/signbridge/speech";
import { getLanguage } from "@/lib/signbridge/languages";
import { VOCABULARY, translateMeaning, type SignEntry } from "@/lib/signbridge/vocabulary";
import type { Prediction } from "@/lib/signbridge/recognizer";

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.72 ? "bg-success" : value >= 0.5 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-28 overflow-hidden rounded-full bg-secondary"
        role="img"
        aria-label={`Confidence ${pct} percent`}
      >
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold tabular-nums">{pct}%</span>
    </div>
  );
}

interface Props {
  candidates: Prediction[];
  onAccept: (sign: SignEntry, confidence: number, corrected: boolean) => void;
}

export function MeaningPanel({ candidates, onAccept }: Props) {
  const { prefs, favorites, toggleFavorite, addCorrection } = useApp();
  const [correcting, setCorrecting] = useState(false);
  const [override, setOverride] = useState<string>("");

  const top = candidates[0];
  if (!top) return null;
  const confident = top.confidence >= prefs.confidenceThreshold;
  const translated = translateMeaning(top.sign, prefs.language);
  const lang = getLanguage(prefs.language);

  const say = async (text: string) => {
    try {
      await speak(text, {
        lang: prefs.language,
        rate: prefs.speechRate,
        voiceURI: prefs.voiceURI,
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const accept = (sign: SignEntry, corrected: boolean) => {
    vibrate(30, prefs.haptics);
    onAccept(sign, top.confidence, corrected);
    if (prefs.autoSpeak) void say(translateMeaning(sign, prefs.language));
  };

  return (
    <div className="surface-card p-5">
      {!confident ? (
        <p className="mb-3 flex items-start gap-2 rounded-lg border border-warning/60 bg-warning/10 p-3 text-sm font-semibold">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          Not confident enough to translate this. Pick the closest meaning below or sign
          again more slowly.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {confident ? "Recognised meaning" : "Best guess"}
        </span>
        <ConfidenceBar value={top.confidence} />
      </div>

      <p className="mt-3 text-2xl font-bold">{top.sign.meaning}</p>
      {prefs.language !== "en" ? (
        <p className="mt-1 text-xl text-primary" lang={lang.bcp47}>
          {translated}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button className="min-h-12" onClick={() => void say(translated)}>
          <Volume2 className="size-5" aria-hidden />
          Speak in {lang.name}
        </Button>
        <Button
          variant="outline"
          className="min-h-12"
          onClick={() => accept(top.sign, false)}
          disabled={!confident}
        >
          Looks right
        </Button>
        <Button
          variant="outline"
          className="min-h-12"
          onClick={() => setCorrecting((c) => !c)}
        >
          <Pencil className="size-4" aria-hidden />
          Wrong sign
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label={
            favorites.includes(top.sign.id) ? "Remove from favourites" : "Add to favourites"
          }
          onClick={() => toggleFavorite(top.sign.id)}
        >
          <Star
            className={`size-5 ${favorites.includes(top.sign.id) ? "fill-accent text-accent" : ""}`}
            aria-hidden
          />
        </Button>
      </div>

      {candidates.length > 1 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-muted-foreground">
            Other possible meanings
          </p>
          <ul className="mt-2 space-y-2">
            {candidates.slice(1).map((c) => (
              <li key={c.sign.id}>
                <button
                  type="button"
                  onClick={() => accept(c.sign, true)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 text-left hover:border-primary"
                >
                  <span className="font-medium">{c.sign.meaning}</span>
                  <ConfidenceBar value={c.confidence} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {correcting ? (
        <div className="mt-4 rounded-xl border border-border p-3">
          <p className="text-sm font-semibold">What did you actually sign?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Select value={override} onValueChange={setOverride}>
              <SelectTrigger className="min-h-12 w-full sm:w-72">
                <SelectValue placeholder="Choose the correct meaning" />
              </SelectTrigger>
              <SelectContent>
                {VOCABULARY.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.meaning}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="min-h-12"
              disabled={!override}
              onClick={() => {
                const sign = VOCABULARY.find((s) => s.id === override);
                if (!sign) return;
                addCorrection({
                  predictedSignId: top.sign.id,
                  actualSignId: sign.id,
                  confidence: top.confidence,
                });
                accept(sign, true);
                setCorrecting(false);
                setOverride("");
                toast.success("Thanks — the correction was logged for model training.");
              }}
            >
              Save correction
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}