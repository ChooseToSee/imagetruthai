import { Menu, X, History, LogOut, Share2, Check, ChevronDown, User, Crown, Zap, CreditCard, Upload, ShieldCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { shareContent } from "@/lib/share";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoSvg from "@/assets/logo.svg";

const ADMIN_EMAIL = "jethrun@comcast.net";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareIcon, setShareIcon] = useState(false);
  const { user, signOut, subscription } = useAuth();
  const { plan, limits } = usePlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanCount, setScanCount] = useState<number | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isIOS && !isInStandaloneMode) {
      const dismissed = sessionStorage.getItem("iosBannerDismissed");
      if (!dismissed) {
        setTimeout(() => setShowIOSBanner(true), 3000);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleTouchOutside = (e: TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleTouchOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, []);

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

  const menuItemClass = "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer";

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
            <div ref={menuRef} className="relative">
              {/* Trigger button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                <span className={planColor}>{planIcon}</span>
                <span>{user.email?.split("@")[0]}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown panel */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden">
                  {/* Header */}
                  <div className="border-b border-border px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{user.email?.split("@")[0]}</span>
                      <span className={`flex items-center gap-1 text-xs font-bold ${planColor}`}>
                        {planIcon} {planLabel}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>

                  {/* Usage stats */}
                  <div className="border-b border-border px-4 py-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted/50 px-2 py-1.5">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                          <Upload className="h-3 w-3" />
                          Scans today
                        </div>
                        <div className="text-xs font-bold text-foreground">
                          {scanCount ?? "..."} / {limits.scansPerDay === Infinity ? "∞" : limits.scansPerDay}
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/50 px-2 py-1.5">
                        <div className="text-[10px] text-muted-foreground">Remaining</div>
                        <div className="text-xs font-bold text-foreground">{scansRemaining}</div>
                      </div>
                      {subscription.subscriptionEnd && (
                        <div className="rounded-md bg-muted/50 px-2 py-1.5">
                          <div className="text-[10px] text-muted-foreground">Renews</div>
                          <div className="text-xs font-bold text-foreground">
                            {new Date(subscription.subscriptionEnd).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upsell */}
                  {plan === "free" && (
                    <div className="border-b border-border px-4 py-2">
                      <a
                        href="/#pricing"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary font-medium hover:bg-primary/15 transition-colors text-center"
                      >
                        ⚡ Upgrade to Plus — 50 scans/day + batch uploads
                      </a>
                    </div>
                  )}
                  {plan === "plus" && (
                    <div className="border-b border-border px-4 py-2">
                      <a
                        href="/#pricing"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary font-medium hover:bg-primary/15 transition-colors text-center"
                      >
                        👑 Upgrade to Pro — unlimited scans + PDF reports
                      </a>
                    </div>
                  )}

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      className={menuItemClass}
                      onClick={() => {
                        setMenuOpen(false);
                        const uploadSection = document.getElementById("upload");
                        if (uploadSection) {
                          uploadSection.scrollIntoView({ behavior: "smooth" });
                        } else {
                          navigate("/");
                          setTimeout(() => {
                            document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
                          }, 300);
                        }
                      }}
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </button>

                    {plan !== "free" ? (
                      <button
                        className={menuItemClass}
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/history");
                        }}
                      >
                        <History className="h-4 w-4" />
                        Scan History
                      </button>
                    ) : (
                      <button
                        className={menuItemClass}
                        onClick={() => {
                          setMenuOpen(false);
                          document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        <History className="h-4 w-4" />
                        <span>
                          Scan History{" "}
                          <span className="text-xs text-primary ml-1">Plus+</span>
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Manage Subscription */}
                  {subscription.subscribed && (
                    <>
                      <div className="mx-3 border-t border-border" />
                      <div className="py-1">
                        <button
                          className={menuItemClass}
                          onClick={async () => {
                            setMenuOpen(false);
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
                          <CreditCard className="h-4 w-4" />
                          Manage Subscription
                        </button>
                      </div>
                    </>
                  )}

                  {/* Admin */}
                  {user?.email === ADMIN_EMAIL && (
                    <>
                      <div className="mx-3 border-t border-border" />
                      <div className="py-1">
                        <button
                          className={menuItemClass}
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/admin");
                          }}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Admin Dashboard
                        </button>
                      </div>
                    </>
                  )}

                  {/* Sign Out */}
                  <div className="mx-3 border-t border-border" />
                  <div className="py-1">
                    <button
                      className={`${menuItemClass} text-destructive hover:text-destructive`}
                      onClick={() => {
                        setMenuOpen(false);
                        void handleSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
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

      {showIOSBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-card border-t border-border px-4 py-3 md:hidden animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-72x72.png"
              className="h-10 w-10 rounded-xl border border-border"
              alt="ImageTruth AI"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Add to Home Screen</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Tap{" "}
                <span className="inline-flex items-center justify-center w-5 h-5 text-[13px]">⋯</span>{" "}
                then Share{" "}
                <svg className="inline h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>{" "}
                then "Add to Home Screen"
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem("iosBannerDismissed", "true");
              setShowIOSBanner(false);
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
