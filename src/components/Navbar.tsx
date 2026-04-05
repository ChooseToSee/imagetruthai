import { Menu, X, History, LogOut, Share2, Check, ChevronDown, User, Crown, Zap, CreditCard, Upload, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { shareContent } from "@/lib/share";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoSvg from "@/assets/logo.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ADMIN_EMAIL = "jethrun@comcast.net";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareIcon, setShareIcon] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, signOut, subscription } = useAuth();
  const { plan, limits } = usePlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanCount, setScanCount] = useState<number | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstallBanner(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchTodayScans = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("scan_history")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      setScanCount(count ?? 0);
    };
    fetchTodayScans();
  }, [user]);

  const scansRemaining = limits.scansPerDay === Infinity
    ? "Unlimited"
    : Math.max(0, limits.scansPerDay - (scanCount ?? 0));

  const planLabel = plan === "free" ? "Free" : plan === "plus" ? "Plus" : "Pro";

  const planIcon = plan === "free"
    ? <User className="h-3.5 w-3.5" />
    : plan === "plus"
    ? <Zap className="h-3.5 w-3.5" />
    : <Crown className="h-3.5 w-3.5" />;

  const planColor = plan === "free"
    ? "text-muted-foreground"
    : plan === "plus"
    ? "text-blue-500"
    : "text-primary";

  const handleShare = async () => {
    const result = await shareContent(
      "Check out ImageTruth AI — instantly detect AI-generated and edited images using multiple AI models for consensus accuracy. Try it free!",
      "ImageTruth AI — Detect AI Images",
      "https://imagetruthai.com"
    );
    if (result === "copied" || result === "shared") {
      setShareIcon(true);
      toast({
        title: result === "shared" ? "Shared!" : "Link copied!",
        description: result === "shared"
          ? "Thanks for sharing ImageTruth AI!"
          : "Share it with anyone.",
      });
      setTimeout(() => setShareIcon(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleManageSubscription = async () => {
    const { data } = await supabase.functions.invoke("customer-portal");
    if (data?.url) window.open(data.url, "_blank");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link 
          to="/" 
          className="flex items-center gap-2"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <img src={logoSvg} alt="ImageTruth AI" className="h-8" />
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            Beta
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a href="/#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </a>
          <a href="/#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8 text-muted-foreground" title="Share ImageTruth AI">
            {shareIcon ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className={planColor}>{planIcon}</span>
                  <span className="text-sm">{user.email?.split("@")[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {/* Account Status Header */}
                <DropdownMenuLabel className="p-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{user.email?.split("@")[0]}</span>
                      <span className={`flex items-center gap-1 text-xs font-bold ${planColor}`}>
                        {planIcon} {planLabel}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Usage Stats */}
                <div className="px-3 py-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Upload className="h-3 w-3" />
                        Scans today
                      </div>
                      <div className="text-xs font-bold">
                        {scanCount ?? "..."} / {limits.scansPerDay === Infinity ? "∞" : limits.scansPerDay}
                      </div>
                    </div>
                    <div className="rounded-md bg-muted/50 px-2 py-1.5">
                      <div className="text-[10px] text-muted-foreground">Remaining</div>
                      <div className="text-xs font-bold">{scansRemaining}</div>
                    </div>
                    {subscription.subscriptionEnd && (
                      <div className="rounded-md bg-muted/50 px-2 py-1.5">
                        <div className="text-[10px] text-muted-foreground">Renews</div>
                        <div className="text-xs font-bold">
                          {new Date(subscription.subscriptionEnd).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upsell for free/plus users */}
                {plan === "free" && (
                  <div className="px-3 pb-2">
                    <a href="/#pricing" className="block rounded-md bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                      ⚡ Upgrade to Plus — 50 scans/day + batch uploads
                    </a>
                  </div>
                )}
                {plan === "plus" && (
                  <div className="px-3 pb-2">
                    <a href="/#pricing" className="block rounded-md bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                      👑 Upgrade to Pro — unlimited scans + PDF reports
                    </a>
                  </div>
                )}

                <DropdownMenuSeparator />

                {/* Navigation Links */}
                <DropdownMenuItem onClick={() => {
                  const uploadSection = document.getElementById("upload");
                  if (uploadSection) {
                    uploadSection.scrollIntoView({ behavior: "smooth" });
                  } else {
                    navigate("/");
                    setTimeout(() => {
                      document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
                    }, 300);
                  }
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/history")}>
                  <History className="h-4 w-4 mr-2" />
                  Scan History
                </DropdownMenuItem>

                {/* Manage Subscription */}
                {subscription.subscribed && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke("customer-portal");
                          if (error) throw error;
                          if (data?.url) window.open(data.url, "_blank");
                        } catch (err) {
                          toast({
                            title: "Could not open billing portal",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </DropdownMenuItem>
                  </>
                )}

                {user?.email === ADMIN_EMAIL && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Sign Out */}
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate("/auth")}>
                Get Started Free
              </Button>
            </>
          )}
        </div>

        <button className="text-muted-foreground md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-3 p-4">
            <a href="/#how-it-works" className="text-sm text-muted-foreground">How It Works</a>
            <a href="/#pricing" className="text-sm text-muted-foreground">Pricing</a>
            <button onClick={handleShare} className="flex items-center gap-2 text-sm text-muted-foreground">
              {shareIcon ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />} Share
            </button>
            {user ? (
              <>
                {/* Mobile Plan Badge */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.email?.split("@")[0]}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {scanCount ?? "..."} scans today · {scansRemaining} remaining
                    </span>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-bold ${planColor}`}>
                    {planIcon} {planLabel}
                  </span>
                </div>

                {/* Upsell */}
                {plan === "free" && (
                  <a href="/#pricing" className="text-xs text-primary font-medium">
                    ⚡ Upgrade to Plus for more scans
                  </a>
                )}
                {plan === "plus" && (
                  <a href="/#pricing" className="text-xs text-primary font-medium">
                    👑 Upgrade to Pro for unlimited scans
                  </a>
                )}

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setTimeout(() => {
                      const uploadSection = document.getElementById("upload");
                      if (uploadSection) {
                        uploadSection.scrollIntoView({ behavior: "smooth" });
                      } else {
                        window.location.href = "/#upload";
                      }
                    }, 100);
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Upload className="h-4 w-4" /> Upload Image
                </button>
                <Link to="/history" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <History className="h-4 w-4" /> Scan History
                </Link>
                {subscription.subscribed && (
                  <button
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke("customer-portal");
                        if (error) throw error;
                        if (data?.url) window.open(data.url, "_blank");
                      } catch (err) {
                        toast({
                          title: "Could not open billing portal",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CreditCard className="h-4 w-4" /> Manage Subscription
                  </button>
                )}
                {user?.email === ADMIN_EMAIL && (
                  <Link to="/admin" className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" /> Admin Dashboard
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button size="sm" className="w-full" onClick={() => navigate("/auth")}>Get Started Free</Button>
              </>
            )}
          </div>
        </div>
      )}

      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-72x72.png" className="h-10 w-10 rounded-xl" alt="ImageTruth AI" />
            <div>
              <p className="text-sm font-semibold text-foreground">Install ImageTruth AI</p>
              <p className="text-xs text-muted-foreground">Add to your home screen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleInstall} className="text-xs">
              Install
            </Button>
            <button onClick={() => setShowInstallBanner(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
