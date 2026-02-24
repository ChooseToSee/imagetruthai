import React from "react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7l-9-5z" fill="currentColor" className="text-primary" stroke="currentColor" strokeWidth="0.5" />
              <line x1="12" y1="7" x2="12" y2="18" stroke="hsl(var(--primary-foreground))" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="9" y1="9" x2="15" y2="9" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" />
              <line x1="9" y1="16" x2="11" y2="16" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" />
              <line x1="13" y1="16" x2="15" y2="16" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-display text-sm font-bold text-foreground">
              ImageTruth AI
            </span>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            No detector is 100% accurate. ImageTruth AI is designed as a helper tool —
            always use your own judgment alongside automated analysis.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="text-[11px] text-muted-foreground/50">
            © 2026 ImageTruth AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
