import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SocialShareButtonsProps {
  /** Returns the URL to share. Should auto-generate the share link if missing. */
  getShareUrl: () => Promise<string> | string;
  /** Pre-built text for platforms that support a share text/intent. */
  shareText: string;
  /** Optional title for LinkedIn share dialog. */
  linkedInTitle?: string;
  /** Visual size of the buttons. */
  size?: "sm" | "default";
}

const iconClass = "h-3.5 w-3.5 fill-current";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12.166.007C8.864-.107 5.514 2.165 4.428 5.673c-.395 1.272-.302 3.484-.246 4.997l.012.288c-.066.04-.205.077-.434.077-.32 0-.71-.087-1.16-.258a1.04 1.04 0 00-.379-.072c-.485 0-1.087.32-1.18.929-.066.434.16 1.063 1.546 1.612.13.052.293.103.466.158.625.197 1.57.495 1.825 1.097.13.31.075.713-.166 1.197l-.005.012c-.065.152-1.621 3.726-5.099 4.302-.279.045-.486.296-.474.578a.96.96 0 00.034.226c.234.546 1.213.94 2.99 1.21.06.092.121.401.158.59.038.196.077.395.13.604.057.221.225.484.687.484.176 0 .378-.038.617-.082.339-.064.804-.151 1.387-.151.32 0 .654.026.991.077 1.187.198 1.967 1.183 3.069 1.733.838.42 1.628.665 2.484.665.012 0 .024-.001.036-.002a.95.95 0 00.116.002c.857 0 1.646-.245 2.484-.665 1.102-.55 1.882-1.535 3.069-1.733a6.04 6.04 0 01.991-.077c.583 0 1.048.087 1.387.151.239.044.441.082.617.082.461 0 .63-.263.687-.484.052-.21.092-.408.13-.604.037-.189.099-.498.158-.59 1.776-.27 2.756-.664 2.99-1.21a.96.96 0 00.034-.226c.012-.282-.195-.533-.474-.578-3.478-.576-5.034-4.15-5.099-4.302l-.005-.012c-.241-.484-.296-.887-.166-1.197.255-.602 1.2-.9 1.825-1.097.173-.055.336-.106.466-.158 1.025-.404 1.557-.918 1.578-1.526a1.07 1.07 0 00-.78-1.066 1.32 1.32 0 00-.499-.099c-.143 0-.273.022-.388.07-.4.16-.756.245-1.058.245-.245 0-.4-.058-.481-.107l.011-.241c.057-1.514.149-3.726-.246-4.998C18.4 2.197 15.082-.107 11.834.007z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className={iconClass} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.1 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.14-.1z" />
  </svg>
);

const SocialShareButtons = ({ getShareUrl, shareText, linkedInTitle = "ImageTruth AI Analysis", size = "sm" }: SocialShareButtonsProps) => {
  const { toast } = useToast();

  const openShare = async (build: (url: string) => string | null, platform: string) => {
    const url = await getShareUrl();
    const target = build(url);
    if (target) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      // Copy-to-clipboard fallback for platforms without web share intents
      try {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        toast({
          title: `Copied! Paste in ${platform}`,
          description: `${platform} doesn't support web sharing — your text and link are on your clipboard.`,
        });
      } catch {
        toast({ title: "Couldn't copy to clipboard", variant: "destructive" });
      }
    }
  };

  const btnClass = "gap-2 text-xs";
  const btnSize = size === "default" ? "default" : "sm";

  return (
    <>
      <Button
        variant="ghost"
        size={btnSize}
        onClick={() => openShare((url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`, "Facebook")}
        className={btnClass}
      >
        <FacebookIcon />
        Share on Facebook
      </Button>
      <Button
        variant="ghost"
        size={btnSize}
        onClick={() => openShare((url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(linkedInTitle)}&summary=${encodeURIComponent(shareText)}`, "LinkedIn")}
        className={btnClass}
      >
        <LinkedInIcon />
        Share on LinkedIn
      </Button>
      <Button
        variant="ghost"
        size={btnSize}
        onClick={() => openShare(() => null, "Instagram")}
        className={btnClass}
      >
        <InstagramIcon />
        Share on Instagram
      </Button>
      <Button
        variant="ghost"
        size={btnSize}
        onClick={() => openShare(() => null, "Snapchat")}
        className={btnClass}
      >
        <SnapchatIcon />
        Share on Snap
      </Button>
      <Button
        variant="ghost"
        size={btnSize}
        onClick={() => openShare(() => null, "TikTok")}
        className={btnClass}
      >
        <TikTokIcon />
        Share on TikTok
      </Button>
    </>
  );
};

export default SocialShareButtons;
