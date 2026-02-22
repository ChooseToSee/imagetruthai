import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display text-sm font-bold text-foreground">
              ImageTruth AI
            </span>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            No detector is 100% accurate. ImageTruth AI is designed as a helper tool —
            always use your own judgment alongside automated analysis.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
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
