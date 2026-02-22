import { usePlan, type PlanTier } from "@/contexts/PlanContext";
import { Bug, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers: { value: PlanTier; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "plus", label: "Plus" },
  { value: "pro", label: "Pro" },
];

const DevPlanToolbar = () => {
  const { plan, setPlan, limits, devMode, setDevMode } = usePlan();

  if (!devMode) {
    return (
      <button
        onClick={() => setDevMode(true)}
        className="fixed bottom-4 right-4 z-[100] rounded-full border border-border bg-card p-2 text-muted-foreground shadow-lg transition-colors hover:text-foreground"
        title="Open dev plan switcher"
      >
        <Bug className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] rounded-xl border border-border bg-card p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dev: Plan Switcher
        </span>
        <button onClick={() => setDevMode(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex gap-1.5">
        {tiers.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={plan === t.value ? "default" : "outline"}
            onClick={() => setPlan(t.value)}
            className="text-xs"
          >
            {t.label}
          </Button>
        ))}
      </div>
      <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
        <p>Scans/day: {limits.scansPerDay === Infinity ? "∞" : limits.scansPerDay}</p>
        <p>Batch limit: {limits.batchLimit}</p>
        <p>History: {limits.historyDays ? `${limits.historyDays} days` : "Unlimited"}</p>
        <p>PDF export: {limits.pdfExport ? "✓" : "✗"} · API: {limits.apiAccess ? "✓" : "✗"}</p>
      </div>
    </div>
  );
};

export default DevPlanToolbar;
