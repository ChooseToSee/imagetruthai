import React from "react";
import logoSvg from "@/assets/logo.svg";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <img src={logoSvg} alt="ImageTruth AI" className="h-6" />
          </div>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            No detector is 100% accurate. ImageTruth AI is designed as a helper tool —
            always use your own judgment alongside automated analysis.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</a>
            <a href="/ai-disclaimer" className="hover:text-foreground transition-colors">AI Disclaimer</a>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="max-w-lg text-[11px] text-muted-foreground/70">
            ImageTruth AI is a trade name (DBA) of Choose To See, LLC, a Colorado limited liability company.
          </p>
          <p className="text-[11px] text-muted-foreground/50">
            © 2026 Choose To See, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
