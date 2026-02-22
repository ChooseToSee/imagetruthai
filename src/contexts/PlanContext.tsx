import { createContext, useContext, useState, ReactNode } from "react";

export type PlanTier = "free" | "plus" | "pro";

interface PlanLimits {
  scansPerDay: number;
  batchLimit: number;
  historyDays: number | null; // null = unlimited
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
  const [plan, setPlan] = useState<PlanTier>("free");
  const [devMode, setDevMode] = useState(false);

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
