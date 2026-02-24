import { Menu, X, History, LogOut, Share2, Check } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { shareContent } from "@/lib/share";
import { useToast } from "@/hooks/use-toast";
import logoSvg from "@/assets/logo.svg";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shareIcon, setShareIcon] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShare = async () => {
    const result = await shareContent(
      "Check out ImageTruth AI — detect AI-generated and edited images instantly!",
      "ImageTruth AI"
    );
    if (result === "copied") {
      setShareIcon(true);
      toast({ title: "Link copied!", description: "Share it with anyone." });
      setTimeout(() => setShareIcon(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
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
            <>
              <Link to="/history" className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <History className="h-4 w-4" /> History
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1 text-muted-foreground">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </>
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
                <Link to="/history" className="text-sm text-muted-foreground">History</Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start">Sign Out</Button>
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
    </nav>
  );
};

export default Navbar;
