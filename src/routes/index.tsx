import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Hand,
  Languages,
  Volume2,
  MessagesSquare,
  Siren,
  GraduationCap,
  Info,
} from "lucide-react";
import heroImage from "@/assets/hero-signing.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SignBridge — Sign language to speech, in your language" },
      {
        name: "description",
        content:
          "SignBridge reads Indian Sign Language from your camera, understands the meaning, and speaks it in Kannada, Hindi, Tamil and more.",
      },
      { property: "og:title", content: "SignBridge — a real communication bridge" },
      {
        property: "og:description",
        content:
          "Camera to hand tracking to meaning to translation to voice. Two-way conversation for sign language users.",
      },
    ],
  }),
  component: Landing,
});

const PIPELINE = [
  { icon: Hand, title: "Camera & tracking", body: "Hands and body landmarks read on device." },
  { icon: Info, title: "Meaning", body: "Sign sequences become whole sentences, not letters." },
  { icon: Languages, title: "Translation", body: "Your language: Kannada, Hindi, Tamil and more." },
  { icon: Volume2, title: "Voice", body: "The sentence is spoken aloud for the other person." },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <span className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="gradient-hero grid size-9 place-items-center rounded-xl text-primary-foreground">
            <Hand className="size-5" aria-hidden />
          </span>
          SignBridge
        </span>
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/translate">Open translator</Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-2 lg:py-14">
        <div>
          <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold text-muted-foreground">
            Indian Sign Language · accessibility first
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            Sign it. We say it — in your language.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            SignBridge watches your signs through the camera, works out what the whole
            sentence means, shows the text, translates it, and speaks it aloud. The other
            person can simply talk back.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="min-h-14 px-6 text-base">
              <Link to="/onboarding">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="destructive" className="min-h-14 px-6 text-base">
              <Link to="/emergency">
                <Siren className="size-5" aria-hidden />
                Emergency
              </Link>
            </Button>
          </div>
        </div>
        <img
          src={heroImage}
          alt="A woman signing to the camera of her laptop"
          width={1280}
          height={960}
          className="w-full rounded-3xl border border-border object-cover shadow-lg"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold">How a sentence travels</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="surface-card p-5">
              <span className="text-sm font-bold text-primary">Step {i + 1}</span>
              <Icon className="mt-3 size-7 text-primary" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-3">
        <FeatureCard
          icon={MessagesSquare}
          title="Conversation mode"
          body="One side signs, the other speaks. Both read the same thread."
          to="/conversation"
        />
        <FeatureCard
          icon={GraduationCap}
          title="Learn & practise"
          body="Step-by-step sign guides with camera feedback on your attempt."
          to="/learn"
        />
        <FeatureCard
          icon={Siren}
          title="Emergency phrases"
          body="Big one-tap buttons that speak instantly, even in a rush."
          to="/emergency"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="surface-card border-warning/60 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Info className="size-5 text-warning" aria-hidden />
            Honest about what this build does today
          </h2>
          <p className="mt-2 text-muted-foreground">
            Hand and body tracking are real and run on your device. Sign recognition in this
            build is a <strong>prototype heuristic</strong> used to demonstrate the full
            pipeline — it is not a trained ISL model and its output is always labelled as
            such. The app ships a clean recognizer interface so a trained CNN+LSTM/Transformer
            model can be connected without touching the interface.
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        SignBridge · built for communication access
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  to,
}: {
  icon: typeof Hand;
  title: string;
  body: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="surface-card block p-5 transition-colors hover:border-primary"
    >
      <Icon className="size-7 text-primary" aria-hidden />
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}
