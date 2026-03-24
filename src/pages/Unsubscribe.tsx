import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MailX, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") { setStatus("already"); return; }
        setStatus("valid");
      } catch { setStatus("invalid"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      setStatus(error ? "error" : "success");
    } catch { setStatus("error"); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Validating your request…</p>
            </div>
          )}
          {status === "valid" && (
            <div className="space-y-4">
              <MailX className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="font-display text-2xl font-bold text-foreground">Unsubscribe</h1>
              <p className="text-muted-foreground">Are you sure you want to unsubscribe from ImageTruth AI emails?</p>
              <Button onClick={handleUnsubscribe} disabled={submitting} variant="destructive" className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Unsubscribe
              </Button>
            </div>
          )}
          {status === "success" && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h1 className="font-display text-2xl font-bold text-foreground">Unsubscribed</h1>
              <p className="text-muted-foreground">You've been unsubscribed and will no longer receive emails from us.</p>
            </div>
          )}
          {status === "already" && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h1 className="font-display text-2xl font-bold text-foreground">Already Unsubscribed</h1>
              <p className="text-muted-foreground">You've already been unsubscribed from our emails.</p>
            </div>
          )}
          {status === "invalid" && (
            <div className="space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="font-display text-2xl font-bold text-foreground">Invalid Link</h1>
              <p className="text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
            </div>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="font-display text-2xl font-bold text-foreground">Something Went Wrong</h1>
              <p className="text-muted-foreground">We couldn't process your request. Please try again later.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
