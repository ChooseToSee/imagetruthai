import { useState } from "react";
import { MessageSquarePlus, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const FeedbackWidget = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"bug" | "feedback">("feedback");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("submit-feedback", {
        body: { type, message: message.trim(), userEmail: user?.email ?? "anonymous" },
      });
      if (error) throw error;
      toast({ title: "Thanks for your feedback!", description: "We'll review it shortly." });
      setMessage("");
      setOpen(false);
    } catch {
      toast({ title: "Couldn't send feedback", description: "Please try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-110"
          aria-label="Send feedback"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-80 rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground">Send Feedback</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Type toggle */}
          <div className="mb-3 flex gap-2">
            {(["feedback", "bug"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  type === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {t === "bug" ? "🐛 Bug" : "💬 Feedback"}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={type === "bug" ? "Describe the bug…" : "Share your thoughts…"}
            className="mb-3 h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={1000}
          />

          <Button
            size="sm"
            className="w-full shadow-glow"
            disabled={!message.trim() || loading}
            onClick={handleSubmit}
          >
            {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
            Send
          </Button>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
