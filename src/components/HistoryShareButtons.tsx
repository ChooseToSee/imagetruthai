import { useState, useCallback } from "react";
import { Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { decideXShareNavigation } from "@/lib/x-share";

export interface ShareableScan {
  verdict: string;
  confidence: number;
  reasons: string[];
  tips?: string[];
  model_breakdown: any | null;
  manipulation: any | null;
  image_url: string | null;
  file_name: string;
}

const iconClass = "h-3.5 w-3.5 fill-current";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
    <path d="M12.166.014c2.418-.06 4.766 1.085 6.151 3.124.978 1.439 1.137 3.117 1.069 4.811-.011.331.014.665-.025.994.184.118.412.144.622.075.345-.082.674-.224 1.01-.34.218-.076.46-.135.692-.077.339.082.609.378.652.726.05.366-.18.71-.477.913-.318.218-.692.327-1.052.466-.235.092-.485.158-.703.293-.156.097-.18.297-.139.46.241 1.011.842 1.886 1.564 2.612.402.396.847.756 1.366 1 .349.165.728.245 1.111.252.245.005.523.063.679.27.183.244.108.59-.082.81-.295.346-.736.516-1.165.633-.611.158-1.245.207-1.875.219-.111.358-.116.764-.388 1.041-.286.279-.71.302-1.082.282-.621-.039-1.234-.184-1.85-.221-.564-.039-1.151.044-1.638.341-.435.262-.781.642-1.176.954-.643.519-1.379.93-2.182 1.117-.349.077-.708.114-1.066.117h-.003c-.359-.003-.717-.04-1.066-.117-.804-.187-1.539-.598-2.183-1.117-.394-.312-.741-.692-1.175-.954-.488-.297-1.075-.38-1.638-.341-.617.037-1.229.182-1.85.221-.372.02-.797-.003-1.082-.282-.272-.277-.277-.683-.388-1.041-.63-.012-1.265-.061-1.875-.219-.43-.117-.871-.287-1.166-.633-.19-.22-.265-.566-.082-.81.156-.207.435-.265.679-.27.384-.007.762-.087 1.111-.252.519-.244.964-.604 1.366-1 .722-.726 1.323-1.601 1.564-2.612.041-.163.017-.363-.139-.46-.218-.135-.468-.201-.703-.293-.36-.139-.734-.248-1.052-.466-.297-.203-.527-.547-.477-.913.043-.348.313-.644.652-.726.232-.058.474.001.692.077.336.116.665.258 1.01.34.21.069.438.043.622-.075-.039-.329-.014-.663-.025-.994-.068-1.694.091-3.372 1.069-4.811C7.4 1.099 9.748-.046 12.166.014z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.1z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface HistoryShareButtonsProps {
  scan: ShareableScan;
}

const HistoryShareButtons = ({ scan }: HistoryShareButtonsProps) => {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const isAI = scan.verdict === "ai";

  const generateLink = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Sign in required", variant: "destructive" });
        return null;
      }
      const { data, error } = await supabase
        .from("shared_reports")
        .insert({
          user_id: session.user.id,
          verdict: scan.verdict,
          confidence: scan.confidence,
          reasons: scan.reasons,
          tips: scan.tips || [],
          model_breakdown: scan.model_breakdown,
          manipulation: scan.manipulation,
          image_url: scan.image_url,
          file_name: scan.file_name,
          is_public: true,
        })
        .select("share_token")
        .single();
      if (error) throw error;
      return `${window.location.origin}/report/${data.share_token}`;
    } catch (err) {
      console.error("[History] Share link failed:", err);
      toast({ title: "Couldn't create share link", variant: "destructive" });
      return null;
    }
  }, [scan, toast]);

  const getOrCreateShareLink = useCallback(async (): Promise<string | null> => {
    if (shareLink) return shareLink;
    setIsGenerating(true);
    const link = await generateLink();
    if (link) setShareLink(link);
    setIsGenerating(false);
    return link;
  }, [shareLink, generateLink]);

  const getShareText = (link: string) =>
    `🔍 ${scan.confidence}% — ${
      isAI ? "AI indicators detected 🤖" : "No AI indicators detected ✅"
    }\n\nSee what 5 AI models found:\n${link}\n\nvia @ImageTruthAI`;

  const handleXShare = async () => {
    const link = await getOrCreateShareLink();
    if (!link) return;
    const nav = decideXShareNavigation(getShareText(link), navigator.userAgent);
    if (nav.mode === "same-tab") {
      window.location.href = nav.url;
    } else {
      window.open(nav.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleFacebookShare = async () => {
    const link = await getOrCreateShareLink();
    if (!link) return;
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: "ImageTruth AI Analysis",
          text: `${scan.confidence}% — ${isAI ? "AI indicators detected" : "No AI indicators detected"}`,
          url: link,
        });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      "_blank",
      "width=600,height=400,noopener,noreferrer"
    );
  };

  const handleLinkedInShare = async () => {
    const link = await getOrCreateShareLink();
    if (!link) return;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      "_blank",
      "width=600,height=400,noopener,noreferrer"
    );
  };

  const handleCopyLink = async (platform: string) => {
    const link = await getOrCreateShareLink();
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link copied!", description: `Paste it into ${platform}` });
    } catch {
      toast({ title: "Couldn't copy link", variant: "destructive" });
    }
  };

  const handleNativeShare = async () => {
    const link = await getOrCreateShareLink();
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ImageTruth AI Analysis",
          text: getShareText(link),
          url: link,
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(link);
          toast({ title: "Copied to clipboard!" });
        }
      }
    } else {
      await navigator.clipboard.writeText(link);
      toast({ title: "Copied to clipboard!" });
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-xs font-medium text-foreground mb-2">Share this analysis:</p>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="ghost" onClick={handleNativeShare} disabled={isGenerating} className="gap-1.5 text-xs h-7 px-2">
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
          Share
        </Button>
        <Button size="sm" variant="ghost" onClick={handleXShare} disabled={isGenerating} className="gap-1.5 text-xs h-7 px-2">
          <XIcon /> X
        </Button>
        <Button size="sm" variant="ghost" onClick={handleFacebookShare} disabled={isGenerating} className="gap-1.5 text-xs h-7 px-2">
          <FacebookIcon /> Facebook
        </Button>
        <Button size="sm" variant="ghost" onClick={handleLinkedInShare} disabled={isGenerating} className="gap-1.5 text-xs h-7 px-2">
          <LinkedInIcon /> LinkedIn
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleCopyLink("Instagram")} disabled={isGenerating} className="gap-1.5 text-xs h-7 px-2">
          <InstagramIcon /> Instagram
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleCopyLink("Snapchat")} disabled={isGenerating} className="gap-1.5 text-xs h-7 px-2">
          <SnapchatIcon /> Snapchat
        </Button>
        <Button size="sm" variant="ghost" onClick={() => handleCopyLink("TikTok")} disabled={isGenerating} className="gap-1.5 text-xs h-7 px-2">
          <TikTokIcon /> TikTok
        </Button>
      </div>
    </div>
  );
};

export default HistoryShareButtons;
