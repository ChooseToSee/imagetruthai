import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type PlanTier = "free" | "plus" | "pro";

interface PlanLimits {
  scansPerDay: number;
  batchLimit: number;
  historyDays: number | null;
  pdfExport: boolean;
  apiAccess: boolean;
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { scansPerDay: 3, batchLimit: 1, historyDays: null, pdfExport: false, apiAccess: false },
  plus: { scansPerDay: 50, batchLimit: 5, historyDays: 30, pdfExport: false, apiAccess: false },
  pro: { scansPerDay: Infinity, batchLimit: 20, historyDays: null, pdfExport: true, apiAccess: true },
};

interface PlanContextType {
  plan: PlanTier;
  setPlan: (plan: PlanTier) => void;
  limits: PlanLimits;
  devMode: boolean;
  setDevMode: (v: boolean) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const { subscription } = useAuth();
  const [overridePlan, setOverridePlan] = useState<PlanTier | null>(null);
  const [devMode, setDevMode] = useState(false);

  // Sync plan from subscription unless dev override is active
  const plan = devMode && overridePlan !== null ? overridePlan : subscription.tier;

  const setPlan = (p: PlanTier) => {
    setOverridePlan(p);
  };

  return (
    <PlanContext.Provider value={{ plan, setPlan, limits: PLAN_LIMITS[plan], devMode, setDevMode }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) throw new Error("usePlan must be used within a PlanProvider");
  return context;
};
