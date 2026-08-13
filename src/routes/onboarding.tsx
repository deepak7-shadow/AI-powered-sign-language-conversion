import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LANGUAGES, type LanguageCode } from "@/lib/signbridge/languages";
import { useApp } from "@/lib/signbridge/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up SignBridge — choose your language" },
      {
        name: "description",
        content:
          "Pick the language SignBridge should show and speak, set your name and accessibility preferences.",
      },
      { property: "og:title", content: "Set up SignBridge" },
      {
        property: "og:description",
        content: "Choose your language and accessibility preferences once — we remember it.",
      },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { prefs, setPrefs } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(prefs.name);

  const finish = () => {
    setPrefs({ name, onboarded: true });
    void navigate({ to: "/translate" });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-10">
      <span className="flex items-center gap-2 font-display text-lg font-bold">
        <span className="gradient-hero grid size-9 place-items-center rounded-xl text-primary-foreground">
          <Hand className="size-5" aria-hidden />
        </span>
        SignBridge
      </span>

      <div className="mt-6 flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>

      {step === 0 ? (
        <section className="mt-8">
          <h1 className="text-3xl font-bold">Which language should we speak?</h1>
          <p className="mt-2 text-muted-foreground">
            Recognised signs will be shown and spoken in this language. You can change it
            any time in Settings.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {LANGUAGES.map((lang) => {
              const active = prefs.language === lang.code;
              return (
                <li key={lang.code}>
                  <button
                    type="button"
                    onClick={() => setPrefs({ language: lang.code as LanguageCode })}
                    aria-pressed={active}
                    className={`flex min-h-16 w-full items-center justify-between rounded-xl border px-4 text-left transition-colors ${
                      active
                        ? "border-primary bg-secondary"
                        : "border-border bg-card hover:border-primary"
                    }`}
                  >
                    <span>
                      <span className="block text-lg font-semibold">{lang.nativeName}</span>
                      <span className="block text-sm text-muted-foreground">{lang.name}</span>
                    </span>
                    {active ? <Check className="size-5 text-primary" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="mt-8 space-y-6">
          <h1 className="text-3xl font-bold">Make it comfortable to read</h1>
          <div>
            <Label htmlFor="scale" className="text-base">
              Text size
            </Label>
            <div className="mt-3 flex gap-2">
              {[
                { v: 1, label: "Normal" },
                { v: 1.15, label: "Large" },
                { v: 1.3, label: "Extra large" },
              ].map((o) => (
                <Button
                  key={o.v}
                  id="scale"
                  variant={prefs.textScale === o.v ? "default" : "outline"}
                  className="min-h-12 flex-1"
                  onClick={() => setPrefs({ textScale: o.v })}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-base">Theme</Label>
            <div className="mt-3 flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <Button
                  key={t}
                  variant={prefs.theme === t ? "default" : "outline"}
                  className="min-h-12 flex-1 capitalize"
                  onClick={() => setPrefs({ theme: t })}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <Label htmlFor="autospeak" className="text-base">
              Speak translations automatically
            </Label>
            <Switch
              id="autospeak"
              checked={prefs.autoSpeak}
              onCheckedChange={(v) => setPrefs({ autoSpeak: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <Label htmlFor="haptics" className="text-base">
              Vibrate on recognition
            </Label>
            <Switch
              id="haptics"
              checked={prefs.haptics}
              onCheckedChange={(v) => setPrefs({ haptics: v })}
            />
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="mt-8 space-y-6">
          <h1 className="text-3xl font-bold">Camera & privacy</h1>
          <div>
            <Label htmlFor="name" className="text-base">
              What should we call you? (optional)
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-2 min-h-12 text-base"
            />
          </div>
          <ul className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
            <li>Camera frames are processed on your device and never uploaded.</li>
            <li>Nothing is recorded unless you explicitly turn recording on.</li>
            <li>History is stored locally and you can delete it at any moment.</li>
          </ul>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <Label htmlFor="history" className="text-base">
              Save my translation history
            </Label>
            <Switch
              id="history"
              checked={prefs.saveHistory}
              onCheckedChange={(v) => setPrefs({ saveHistory: v })}
            />
          </div>
        </section>
      ) : null}

      <div className="mt-10 flex gap-3">
        {step > 0 ? (
          <Button variant="outline" className="min-h-14 flex-1" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : null}
        <Button
          className="min-h-14 flex-1 text-base"
          onClick={() => (step === 2 ? finish() : setStep(step + 1))}
        >
          {step === 2 ? "Start using SignBridge" : "Continue"}
        </Button>
      </div>
    </div>
  );
}