import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Swatch = { name: string; hex: string; hsl: string; tw?: string; textOnLight?: boolean };

const surfaces: Swatch[] = [
  { name: "Background", hex: "#08090C", hsl: "220 20% 4%", tw: "bg-background" },
  { name: "Card",       hex: "#11141A", hsl: "220 18% 8%", tw: "bg-card" },
  { name: "Muted",      hex: "#1A1D24", hsl: "220 14% 12%", tw: "bg-muted" },
  { name: "Border",     hex: "#22262E", hsl: "220 14% 16%", tw: "border-border" },
  { name: "Accent",     hex: "#1A2659", hsl: "227 50% 20%", tw: "bg-accent" },
];

const text: Swatch[] = [
  { name: "Foreground",       hex: "#E5E9F0", hsl: "210 20% 92%", tw: "text-foreground", textOnLight: true },
  { name: "Muted Foreground", hex: "#6F7787", hsl: "215 12% 50%", tw: "text-muted-foreground" },
  { name: "Primary",          hex: "#4D7CFF", hsl: "227 100% 65%", tw: "text-primary" },
];

const status: Swatch[] = [
  { name: "Success",     hex: "#33CC85", hsl: "152 60% 50%", tw: "bg-success" },
  { name: "Warning",     hex: "#F09022", hsl: "28 90% 55%",  tw: "bg-warning" },
  { name: "Destructive", hex: "#E04848", hsl: "0 72% 55%",   tw: "bg-destructive" },
];

const scale = [
  ["Display", "48px / 3rem",    "font-display font-bold", "text-5xl"],
  ["H1",      "36px / 2.25rem", "text-4xl font-bold",     "text-4xl"],
  ["H2",      "30px / 1.875rem","text-3xl font-semibold", "text-3xl"],
  ["H3",      "24px / 1.5rem",  "text-2xl font-semibold", "text-2xl"],
  ["Body Lg", "18px / 1.125rem","text-lg",                "text-lg"],
  ["Body",    "16px / 1rem",    "text-base",              "text-base"],
  ["Small",   "14px / 0.875rem","text-sm text-muted-foreground", "text-sm text-muted-foreground"],
  ["Caption", "12px / 0.75rem", "text-xs text-muted-foreground", "text-xs text-muted-foreground"],
];

function SwatchCard({ s }: { s: Swatch }) {
  return (
    <div>
      <div
        className="h-24 w-full rounded-lg border border-border"
        style={{ backgroundColor: s.hex }}
      />
      <div className="mt-2">
        <div className="font-semibold text-foreground">{s.name}</div>
        <div className="text-xs font-mono text-muted-foreground">{s.hex}</div>
        <div className="text-xs font-mono text-muted-foreground">hsl({s.hsl})</div>
        {s.tw && <div className="text-xs font-mono text-primary mt-1">{s.tw}</div>}
      </div>
    </div>
  );
}

export default function StyleGuide() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Brand & Design Guidelines — ImageTruth AI</title>
        <meta name="description" content="ImageTruth AI brand and design system: colors, typography, components, and tokens." />
      </Helmet>

      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="container max-w-5xl py-16 px-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="font-display text-5xl font-bold tracking-tight">ImageTruth AI</h1>
              <p className="mt-2 text-lg opacity-90">Brand & Design System Guidelines</p>
              <p className="mt-1 text-sm opacity-75">Version 1.0 · May 2026</p>
            </div>
            <a href="/imagetruth-style-guide.pdf" download>
              <Button variant="secondary" className="gap-2">
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </a>
          </div>
        </div>
      </section>

      <div className="container max-w-5xl px-6 py-12 space-y-16">
        {/* Philosophy */}
        <section>
          <h2 className="text-3xl font-semibold mb-4">Design Philosophy</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Minimal, dark forensic aesthetic. Every pixel earns its place.</li>
            <li>• Trust through restraint: clean text over visual gimmicks.</li>
            <li>• Professional blue accent — calm, analytical, credible.</li>
            <li>• No overlays, heatmaps, or split-view comparisons.</li>
            <li>• Space Grotesk for headings; Inter for body. Never serif.</li>
          </ul>
        </section>

        {/* Highlight Blue feature */}
        <section>
          <h2 className="text-3xl font-semibold mb-4">Highlight Blue</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 bg-primary text-primary-foreground border-0">
              <div className="text-xs uppercase tracking-wider opacity-80">Primary Brand Accent</div>
              <div className="font-display text-3xl font-bold mt-2">#4D7CFF</div>
              <div className="font-mono text-sm opacity-90 mt-1">hsl(227 100% 65%)</div>
              <div className="text-xs mt-3 opacity-80">Tailwind: bg-primary · text-primary</div>
            </Card>
            <Card className="p-6 border-0" style={{ backgroundColor: "#80A3FF", color: "#08090C" }}>
              <div className="text-xs uppercase tracking-wider opacity-80">Primary Glow (Hover / Gradient)</div>
              <div className="font-display text-3xl font-bold mt-2">#80A3FF</div>
              <div className="font-mono text-sm opacity-90 mt-1">hsl(227 100% 75%)</div>
            </Card>
          </div>
        </section>

        {/* Surfaces */}
        <section>
          <h2 className="text-3xl font-semibold mb-4">Surfaces</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {surfaces.map(s => <SwatchCard key={s.name} s={s} />)}
          </div>
        </section>

        {/* Text */}
        <section>
          <h2 className="text-3xl font-semibold mb-4">Text</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {text.map(s => <SwatchCard key={s.name} s={s} />)}
          </div>
        </section>

        {/* Status */}
        <section>
          <h2 className="text-3xl font-semibold mb-4">Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {status.map(s => <SwatchCard key={s.name} s={s} />)}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-3xl font-semibold mb-6">Typography</h2>
          <Card className="p-8 mb-4">
            <div className="text-xs text-primary uppercase tracking-wider font-semibold">Display · Space Grotesk</div>
            <p className="font-display text-5xl font-bold mt-3">Verify before you trust.</p>
            <p className="text-sm text-muted-foreground mt-4">Weights 300–700 · Use for h1–h6, hero copy, marketing</p>
          </Card>
          <Card className="p-8">
            <div className="text-xs text-primary uppercase tracking-wider font-semibold">Body · Inter</div>
            <p className="text-lg mt-3">
              ImageTruth AI aggregates findings from five independent AI models that
              analyze images for AI generation, deepfake signatures, and visual manipulation.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Weights 300–700 · Use for paragraphs, UI labels, buttons</p>
          </Card>

          <h3 className="text-xl font-semibold mt-8 mb-3">Type Scale</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Size</th>
                  <th className="text-left py-2">Tailwind</th>
                  <th className="text-left py-2">Preview</th>
                </tr>
              </thead>
              <tbody>
                {scale.map(([n, sz, cls, preview], i) => (
                  <tr key={n} className={i % 2 ? "bg-muted/40" : ""}>
                    <td className="py-2 font-semibold">{n}</td>
                    <td className="py-2 font-mono text-muted-foreground">{sz}</td>
                    <td className="py-2 font-mono text-muted-foreground">{cls}</td>
                    <td className="py-2"><span className={preview as string}>Aa</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Spacing & Radius */}
        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-semibold mb-4">Spacing</h2>
            <p className="text-sm text-muted-foreground mb-3">Tailwind: 1 = 0.25rem = 4px</p>
            <div className="space-y-2">
              {[1,2,3,4,6,8,12,16].map(n => (
                <div key={n} className="flex items-center gap-3">
                  <div className="bg-primary h-4" style={{ width: `${n*4}px` }} />
                  <span className="font-mono text-xs text-muted-foreground">{n} · {n*4}px</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-semibold mb-4">Border Radius</h2>
            <p className="text-sm text-muted-foreground mb-3">--radius: 0.75rem (12px)</p>
            <div className="flex gap-3 flex-wrap">
              {[
                ["sm", "rounded-sm"], ["md", "rounded-md"], ["lg", "rounded-lg"],
                ["xl", "rounded-xl"], ["full", "rounded-full"]
              ].map(([n, c]) => (
                <div key={n} className="text-center">
                  <div className={`w-20 h-14 bg-card border border-border ${c}`} />
                  <div className="text-xs text-muted-foreground mt-1">{n}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Components */}
        <section>
          <h2 className="text-3xl font-semibold mb-4">Components</h2>
          <h3 className="text-lg font-semibold mb-3">Buttons</h3>
          <div className="flex gap-3 flex-wrap mb-8">
            <Button>Analyze Image</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost" className="text-primary">Learn more →</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          <h3 className="text-lg font-semibold mb-3">Card</h3>
          <Card className="p-6 max-w-sm">
            <div className="text-xs font-bold text-primary uppercase tracking-wider">Verified</div>
            <div className="text-xl font-bold mt-2">No AI indicators detected</div>
            <div className="text-sm text-muted-foreground mt-1">5 of 5 models in agreement</div>
            <div className="text-sm text-muted-foreground">Analysis time: 2.4s</div>
          </Card>
        </section>

        {/* Voice & Don'ts */}
        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-semibold mb-4">Voice & Tone</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Calm, factual, evidence-led. Never alarmist.</li>
              <li>• Plain language — journalists & the public are the audience.</li>
              <li>• Always frame results as probabilistic; never definitive.</li>
              <li>• Avoid jargon unless paired with a one-line definition.</li>
              <li>• Inclusive, neutral, and respectful of subjects in images.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-semibold mb-4 text-destructive">Don't</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>— Use heatmaps, overlays, or split-view comparisons.</li>
              <li>— Use serif or playful display fonts.</li>
              <li>— Use raw hex values in components — use semantic tokens.</li>
              <li>— Use 'Beta' branding or hedge the product as experimental.</li>
              <li>— Use light backgrounds — the app is dark-only by design.</li>
            </ul>
          </div>
        </section>

        <div className="pt-8 border-t border-border text-sm text-muted-foreground flex justify-between flex-wrap gap-2">
          <span>ImageTruth AI — Brand & Design Guidelines</span>
          <Link to="/" className="text-primary hover:underline">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
