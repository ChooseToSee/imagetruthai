import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { productIdToTier } from "@/lib/stripe-config";
import type { PlanTier } from "@/contexts/PlanContext";
import { clearSessionConsent } from "@/lib/consent";

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  tier: PlanTier;
  subscriptionEnd: string | null;
  status: string | null; // "active" | "past_due" | null
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionState;
  refreshSubscription: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultSub: SubscriptionState = { subscribed: false, productId: null, tier: "free", subscriptionEnd: null, status: null };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSub);

  const refreshSubscription = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) {
      setSubscription(defaultSub);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      const tier = (data.subscription_tier as PlanTier) || productIdToTier(data.product_id);
      setSubscription({
        subscribed: data.subscribed,
        productId: data.product_id,
        tier,
        subscriptionEnd: data.subscription_end,
        status: data.status ?? null,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          setTimeout(() => refreshSubscription(), 0);
        } else {
          setSubscription(defaultSub);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) refreshSubscription();
    });

    return () => authSub.unsubscribe();
  }, [refreshSubscription]);

  // Periodic refresh every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshSubscription, 60_000);
    return () => clearInterval(interval);
  }, [user, refreshSubscription]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    clearSessionConsent();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, subscription, refreshSubscription, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
