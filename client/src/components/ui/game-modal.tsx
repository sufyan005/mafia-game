import * as React from "react";
import { cn } from "@/lib/utils";

interface GameModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const GameModal = React.forwardRef<HTMLDivElement, GameModalProps>(
  ({ className, open = true, onOpenChange, children, ...props }, ref) => {
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && onOpenChange) {
          onOpenChange(false);
        }
      };

      if (open) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black/80"
          onClick={() => onOpenChange?.(false)}
        />
        <div
          ref={ref}
          className={cn(
            "relative z-50 w-full max-w-lg mx-4 animate-in fade-in-0 zoom-in-95",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

GameModal.displayName = "GameModal";

export { GameModal };
