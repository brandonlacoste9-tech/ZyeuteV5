import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "destructive" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",

          // Variant styles - Using Quebec colors!
          {
            "bg-zyeute-blue text-white hover:bg-zyeute-blue/90 focus-visible:ring-zyeute-blue":
              variant === "primary",
            "bg-zyeute-alert text-white hover:bg-zyeute-alert/90 focus-visible:ring-zyeute-alert":
              variant === "destructive",
            "bg-zyeute-snow text-zyeute-blue hover:bg-zyeute-snow/80 focus-visible:ring-zyeute-blue":
              variant === "secondary",
            "border border-zyeute-blue text-zyeute-blue hover:bg-zyeute-snow focus-visible:ring-zyeute-blue":
              variant === "outline",
          },

          // Size styles
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-base": size === "md",
            "h-12 px-6 text-lg": size === "lg",
          },

          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };

// ✅ QUEBEC-COMPLIANT USAGE EXAMPLES:
//
// Primary button (Quebec Blue):
// <Button>Envoyer</Button>
//
// Destructive button (Alert Red):
// <Button variant="destructive">Sacrer ça aux vidanges</Button>
//
// Secondary button:
// <Button variant="secondary">Annuler</Button>
//
// ❌ WRONG - Don't use English:
// <Button>Submit</Button>  // Use "Envoyer" instead!
// <Button variant="destructive">Delete</Button>  // Use "Sacrer ça aux vidanges"!
