import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/signbridge/AppShell";
import { useApp } from "@/lib/signbridge/store";
import { VOCABULARY, CATEGORY_LABELS } from "@/lib/signbridge/vocabulary";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Model & vocabulary dashboard — SignBridge" },
      {
        name: "description",
        content:
          "Vocabulary coverage, recognition corrections and dataset notes for improving the ISL model.",
      },
      { property: "og:title", content: "Model & vocabulary dashboard" },
      {
        property: "og:description",
        content: "Track corrections and coverage that feed the next ISL model training run.",
      },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { corrections, history } = useApp();
  const byCategory = Object.keys(CATEGORY_LABELS).map((cat) => ({
    cat,
    count: VOCABULARY.filter((s) => s.category === cat).length,
  }));
  const avgConfidence =
    history.filter((h) => typeof h.confidence === "number").reduce(
      (a, h) => a + (h.confidence ?? 0),
      0,
    ) / Math.max(1, history.filter((h) => typeof h.confidence === "number").length);

  return (
    <AppShell
      title="Model dashboard"
      description="Local prototype metrics. In production these feed the training pipeline described in the docs."
    >
      <ul className="grid gap-4 sm:grid-cols-3">
        <li className="surface-card p-5">
          <p className="font-display text-3xl font-bold">{VOCABULARY.length}</p>
          <p className="text-sm text-muted-foreground">Signs in vocabulary</p>
        </li>
        <li className="surface-card p-5">
          <p className="font-display text-3xl font-bold">
            {Math.round(avgConfidence * 100)}%
          </p>
          <p className="text-sm text-muted-foreground">Average confidence</p>
        </li>
        <li className="surface-card p-5">
          <p className="font-display text-3xl font-bold">{corrections.length}</p>
          <p className="text-sm text-muted-foreground">User corrections logged</p>
        </li>
      </ul>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Coverage by category</h2>
        <ul className="mt-3 space-y-2">
          {byCategory.map((c) => (
            <li key={c.cat} className="flex items-center gap-3">
              <span className="w-32 capitalize">{c.cat}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(c.count / VOCABULARY.length) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right tabular-nums">{c.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Recent corrections</h2>
        {corrections.length ? (
          <ul className="mt-3 space-y-2">
            {corrections.slice(0, 20).map((c) => (
              <li key={c.id} className="surface-card p-4 text-sm">
                Predicted <strong>{c.predictedSignId}</strong> at{" "}
                {Math.round(c.confidence * 100)}% — actually{" "}
                <strong>{c.actualSignId}</strong> ·{" "}
                {new Date(c.at).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted-foreground">
            No corrections yet. Use “Wrong sign” in the translator to log one.
          </p>
        )}
      </section>
    </AppShell>
  );
}