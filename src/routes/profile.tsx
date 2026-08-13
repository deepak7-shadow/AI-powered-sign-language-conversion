import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/signbridge/AppShell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/signbridge/store";
import { getLanguage } from "@/lib/signbridge/languages";
import { VOCABULARY } from "@/lib/signbridge/vocabulary";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile & progress — SignBridge" },
      {
        name: "description",
        content:
          "See your saved signs, practice progress and translation activity in SignBridge.",
      },
      { property: "og:title", content: "Your profile & progress" },
      {
        property: "og:description",
        content: "Favourite signs, practice accuracy and recent activity in one place.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { prefs, favorites, history, practice } = useApp();
  const attempts = Object.values(practice).reduce((a, p) => a + p.attempts, 0);
  const correct = Object.values(practice).reduce((a, p) => a + p.correct, 0);
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;

  const stats = [
    { label: "Translations", value: history.length },
    { label: "Practice attempts", value: attempts },
    { label: "Practice accuracy", value: `${accuracy}%` },
    { label: "Saved signs", value: favorites.length },
  ];

  return (
    <AppShell
      title={prefs.name ? `Hello, ${prefs.name}` : "Your profile"}
      description={`Speaking and reading in ${getLanguage(prefs.language).name}.`}
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className="surface-card p-5">
            <p className="font-display text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Saved signs</h2>
        {favorites.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {favorites.map((id) => {
              const sign = VOCABULARY.find((s) => s.id === id);
              if (!sign) return null;
              return (
                <li
                  key={id}
                  className="rounded-full border border-border bg-card px-3 py-1.5 font-medium"
                >
                  {sign.meaning}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Star a sign in the Learn section to keep it here.
          </p>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild className="min-h-12">
          <Link to="/practice">Continue practising</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-12">
          <Link to="/settings">Settings & privacy</Link>
        </Button>
      </div>
    </AppShell>
  );
}