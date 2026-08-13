import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { AppShell } from "@/components/signbridge/AppShell";
import { SignCamera } from "@/components/signbridge/SignCamera";
import { ConfidenceBar } from "@/components/signbridge/MeaningPanel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/lib/signbridge/store";
import { VOCABULARY } from "@/lib/signbridge/vocabulary";
import type { RecognitionOutput } from "@/lib/signbridge/recognizer";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice ISL with live feedback — SignBridge" },
      {
        name: "description",
        content:
          "Practice Indian Sign Language in front of the camera and get instant feedback on each attempt.",
      },
      { property: "og:title", content: "Practice ISL with live feedback" },
      {
        property: "og:description",
        content: "Attempt a sign, see the match score, and track your streak.",
      },
    ],
  }),
  component: Practice,
});

function Practice() {
  const { prefs, practice, recordPractice } = useApp();
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; score: number } | null>(null);

  const deck = useMemo(() => VOCABULARY.slice(0, 12), []);
  const target = deck[index % deck.length]!;
  const stat = practice[target.id];
  const learned = Object.values(practice).filter((p) => p.correct > 0).length;

  const onResult = (out: RecognitionOutput) => {
    const match = out.candidates.find((c) => c.sign.id === target.id);
    const score = match?.confidence ?? 0;
    const ok = score >= prefs.confidenceThreshold;
    setFeedback({ ok, score });
    recordPractice(target.id, ok);
  };

  const next = () => {
    setFeedback(null);
    setIndex((i) => i + 1);
  };

  return (
    <AppShell
      title="Practice"
      description="Sign the prompt into the camera. You get an honest match score for every attempt."
    >
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Signs practised correctly</span>
          <span>
            {learned} / {deck.length}
          </span>
        </div>
        <Progress value={(learned / deck.length) * 100} className="mt-2 h-3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="surface-card p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sign this
            </p>
            <h2 className="mt-1 font-display text-4xl font-bold">{target.meaning}</h2>
            <ol className="mt-4 list-decimal space-y-1 pl-5">
              {target.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {target.facialCue ? (
              <p className="mt-3 rounded-lg bg-secondary p-2 text-sm">
                <strong>Expression:</strong> {target.facialCue}
              </p>
            ) : null}
            {stat ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Attempts: {stat.attempts} · Correct: {stat.correct}
              </p>
            ) : null}
          </div>

          {feedback ? (
            <div
              className={`surface-card flex flex-wrap items-center gap-3 p-5 ${
                feedback.ok ? "border-success" : "border-warning"
              }`}
              aria-live="polite"
            >
              {feedback.ok ? (
                <CheckCircle2 className="size-7 text-success" aria-hidden />
              ) : (
                <XCircle className="size-7 text-warning" aria-hidden />
              )}
              <div>
                <p className="text-lg font-semibold">
                  {feedback.ok ? "Matched — nicely done." : "Not quite. Try again slower."}
                </p>
                <ConfidenceBar value={feedback.score} />
              </div>
              <Button className="ml-auto min-h-12" onClick={next}>
                <RefreshCw className="size-4" aria-hidden />
                Next sign
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="min-h-12" onClick={next}>
              Skip to next sign
            </Button>
          )}
        </div>

        <SignCamera mirror={prefs.mirrorCamera} onResult={onResult} />
      </div>
    </AppShell>
  );
}