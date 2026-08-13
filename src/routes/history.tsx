import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Trash2, Volume2 } from "lucide-react";
import { AppShell } from "@/components/signbridge/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/signbridge/store";
import { speak } from "@/lib/signbridge/speech";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Translation history — SignBridge" },
      {
        name: "description",
        content:
          "Every sign, phrase and spoken message you translated, stored only on this device and deletable at any time.",
      },
      { property: "og:title", content: "Translation history" },
      {
        property: "og:description",
        content: "Review, replay and export your SignBridge conversations.",
      },
    ],
  }),
  component: History,
});

function History() {
  const { history, clearHistory, removeHistory, prefs } = useApp();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (h) =>
        h.meaning.toLowerCase().includes(q) || h.translated.toLowerCase().includes(q),
    );
  }, [history, query]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "signbridge-history.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="History"
      description="Stored locally on this device. Nothing is uploaded to a server."
    >
      <div className="flex flex-wrap gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search history"
          aria-label="Search history"
          className="min-h-12 max-w-sm"
        />
        <Button variant="outline" className="min-h-12" onClick={exportJson}>
          <Download className="size-4" aria-hidden />
          Export
        </Button>
        <Button
          variant="destructive"
          className="min-h-12"
          onClick={clearHistory}
          disabled={history.length === 0}
        >
          <Trash2 className="size-4" aria-hidden />
          Delete all
        </Button>
      </div>

      <ul className="mt-6 space-y-3">
        {items.map((h) => (
          <li key={h.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-48 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {h.source} · {new Date(h.at).toLocaleString()}
                {typeof h.confidence === "number"
                  ? ` · ${Math.round(h.confidence * 100)}%`
                  : ""}
                {h.corrected ? " · corrected" : ""}
              </p>
              <p className="text-lg font-semibold">{h.meaning}</p>
              {h.translated !== h.meaning ? (
                <p className="text-primary">{h.translated}</p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              aria-label={`Play ${h.translated}`}
              onClick={() =>
                void speak(h.translated, {
                  lang: h.language,
                  rate: prefs.speechRate,
                  voiceURI: prefs.voiceURI,
                }).catch(() => undefined)
              }
            >
              <Volume2 className="size-5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              aria-label={`Delete ${h.meaning}`}
              onClick={() => removeHistory(h.id)}
            >
              <Trash2 className="size-5" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      {items.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          Nothing here yet — translations you make will be listed on this page.
        </p>
      ) : null}
    </AppShell>
  );
}