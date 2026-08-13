import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/signbridge/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, type LanguageCode } from "@/lib/signbridge/languages";
import { useApp } from "@/lib/signbridge/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & privacy — SignBridge" },
      {
        name: "description",
        content:
          "Control language, speech, camera, accessibility and privacy options for SignBridge.",
      },
      { property: "og:title", content: "Settings & privacy" },
      {
        property: "og:description",
        content: "Tune speech speed, confidence threshold, theme and data retention.",
      },
    ],
  }),
  component: SettingsPage,
});

function Row({ id, label, hint, children }: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <Label htmlFor={id} className="text-base">
          {label}
        </Label>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { prefs, setPrefs, resetAll } = useApp();

  return (
    <AppShell title="Settings" description="Everything is stored on this device only.">
      <div className="grid max-w-3xl gap-4">
        <Row id="language" label="Language for text and speech">
          <Select
            value={prefs.language}
            onValueChange={(v) => setPrefs({ language: v as LanguageCode })}
          >
            <SelectTrigger id="language" className="min-h-12 w-56">
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
        </Row>

        <Row id="theme" label="Theme">
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <Button
                key={t}
                variant={prefs.theme === t ? "default" : "outline"}
                className="min-h-11 capitalize"
                onClick={() => setPrefs({ theme: t })}
              >
                {t}
              </Button>
            ))}
          </div>
        </Row>

        <Row id="scale" label="Text size" hint={`${Math.round(prefs.textScale * 100)}%`}>
          <Slider
            id="scale"
            className="w-56"
            min={1}
            max={1.4}
            step={0.05}
            value={[prefs.textScale]}
            onValueChange={([v]) => setPrefs({ textScale: v ?? 1 })}
          />
        </Row>

        <Row
          id="rate"
          label="Speech speed"
          hint={`${prefs.speechRate.toFixed(2)}× — lower is easier to follow`}
        >
          <Slider
            id="rate"
            className="w-56"
            min={0.6}
            max={1.4}
            step={0.05}
            value={[prefs.speechRate]}
            onValueChange={([v]) => setPrefs({ speechRate: v ?? 1 })}
          />
        </Row>

        <Row
          id="threshold"
          label="Confidence needed to translate"
          hint={`${Math.round(prefs.confidenceThreshold * 100)}% — higher means fewer wrong guesses`}
        >
          <Slider
            id="threshold"
            className="w-56"
            min={0.4}
            max={0.95}
            step={0.01}
            value={[prefs.confidenceThreshold]}
            onValueChange={([v]) => setPrefs({ confidenceThreshold: v ?? 0.72 })}
          />
        </Row>

        <Row id="autospeak" label="Speak translations automatically">
          <Switch
            id="autospeak"
            checked={prefs.autoSpeak}
            onCheckedChange={(v) => setPrefs({ autoSpeak: v })}
          />
        </Row>
        <Row id="captions" label="Always show large captions">
          <Switch
            id="captions"
            checked={prefs.captions}
            onCheckedChange={(v) => setPrefs({ captions: v })}
          />
        </Row>
        <Row id="haptics" label="Vibrate on recognition">
          <Switch
            id="haptics"
            checked={prefs.haptics}
            onCheckedChange={(v) => setPrefs({ haptics: v })}
          />
        </Row>
        <Row id="mirror" label="Mirror the camera" hint="Feels natural for self-view">
          <Switch
            id="mirror"
            checked={prefs.mirrorCamera}
            onCheckedChange={(v) => setPrefs({ mirrorCamera: v })}
          />
        </Row>
        <Row
          id="savehistory"
          label="Save translation history"
          hint="Kept in this browser only"
        >
          <Switch
            id="savehistory"
            checked={prefs.saveHistory}
            onCheckedChange={(v) => setPrefs({ saveHistory: v })}
          />
        </Row>
        <Row
          id="landmarks"
          label="Keep landmarks only, never frames"
          hint="Camera images stay in memory and are discarded immediately"
        >
          <Switch
            id="landmarks"
            checked={prefs.storeLandmarksOnly}
            onCheckedChange={(v) => setPrefs({ storeLandmarksOnly: v })}
          />
        </Row>

        <Button variant="destructive" className="min-h-12 w-fit" onClick={resetAll}>
          Erase all SignBridge data on this device
        </Button>
      </div>
    </AppShell>
  );
}