import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

interface ScanRecord {
  id: string;
  file_name: string;
  verdict: string;
  confidence: number;
  reasons: string[];
  created_at: string;
  image_url: string | null;
}

const History = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchScans = async () => {
      const { data, error } = await supabase
        .from("scan_history")
        .select("id, file_name, verdict, confidence, reasons, created_at, image_url")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        toast({ title: "Error loading history", description: error.message, variant: "destructive" });
      } else {
        setScans(data || []);
      }
      setLoading(false);
    };
    fetchScans();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scan_history").delete().eq("id", id);
    if (!error) {
      setScans((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <p className="text-muted-foreground">Please sign in to view your scan history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="mb-8 font-display text-3xl font-bold text-foreground">Scan History</h1>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : scans.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Clock className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No scans yet. Upload an image to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  {scan.image_url ? (
                    <img
                      src={scan.image_url}
                      alt={scan.file_name}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : scan.verdict === "ai" ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{scan.file_name}</p>
                      {scan.verdict === "ai" ? (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">AI</span>
                      ) : (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Human</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {scan.confidence}% confidence · {new Date(scan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(scan.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default History;
