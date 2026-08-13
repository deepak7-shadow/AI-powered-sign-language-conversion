import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Star, Volume2 } from "lucide-react";
import { AppShell } from "@/components/signbridge/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/signbridge/store";
import { speak } from "@/lib/signbridge/speech";
import { getLanguage } from "@/lib/signbridge/languages";
import { VOCABULARY, translateMeaning, CATEGORY_LABELS } from "@/lib/signbridge/vocabulary";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn Indian Sign Language — SignBridge" },
      {
        name: "description",
        content:
          "Step-by-step guides for everyday, medical and emergency ISL signs, with meanings in ten Indian languages.",
      },
      { property: "og:title", content: "Learn Indian Sign Language" },
      {
        property: "og:description",
        content: "Browse ISL signs by category with clear hand, movement and expression cues.",
      },
    ],
  }),
  component: Learn,
});

function Learn() {
  const { prefs, favorites, toggleFavorite } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const lang = getLanguage(prefs.language);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VOCABULARY.filter((s) => {
      const inCat = category === "all" || s.category === category;
      const inQuery =
        !q ||
        s.meaning.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        translateMeaning(s, prefs.language).toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [query, category, prefs.language]);

  return (
    <AppShell
      title="Learn ISL"
      description="Each card explains the handshape, the movement and the facial expression that changes the meaning."
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search signs"
            aria-label="Search signs"
            className="min-h-12 pl-9"
          />
        </div>
        <Button asChild variant="outline" className="min-h-12">
          <Link to="/practice">Practice with camera</Link>
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["all", ...Object.keys(CATEGORY_LABELS)].map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={category === cat ? "default" : "outline"}
            className="min-h-11 capitalize"
            onClick={() => setCategory(cat)}
            aria-pressed={category === cat}
          >
            {cat}
          </Button>
        ))}
      </div>

      <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((sign) => (
          <li key={sign.id} className="surface-card flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold">{sign.meaning}</h2>
                {prefs.language !== "en" ? (
                  <p className="text-lg text-primary" lang={lang.bcp47}>
                    {translateMeaning(sign, prefs.language)}
                  </p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label={
                  favorites.includes(sign.id)
                    ? `Remove ${sign.meaning} from favourites`
                    : `Save ${sign.meaning} to favourites`
                }
                onClick={() => toggleFavorite(sign.id)}
              >
                <Star
                  className={`size-5 ${favorites.includes(sign.id) ? "fill-accent text-accent" : ""}`}
                  aria-hidden
                />
              </Button>
            </div>
            <span className="mt-2 w-fit rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
              {sign.category}
            </span>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              {sign.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {sign.facialCue ? (
              <p className="mt-3 rounded-lg bg-secondary p-2 text-sm">
                <strong>Expression:</strong> {sign.facialCue}
              </p>
            ) : null}
            <Button
              variant="outline"
              className="mt-4 min-h-12"
              onClick={() =>
                void speak(translateMeaning(sign, prefs.language), {
                  lang: prefs.language,
                  rate: prefs.speechRate,
                  voiceURI: prefs.voiceURI,
                }).catch(() => undefined)
              }
            >
              <Volume2 className="size-4" aria-hidden />
              Hear the word
            </Button>
          </li>
        ))}
      </ul>
      {results.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          No signs match “{query}”. Try another word.
        </p>
      ) : null}
    </AppShell>
  );
}