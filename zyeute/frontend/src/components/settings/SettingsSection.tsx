/**
 * SettingsSection - Collapsible settings section container
 */

import React, { useState } from "react";
import { cn } from "../../lib/utils";

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("card-edge overflow-hidden", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-400/20 flex items-center justify-center text-xl">
            {icon}
          </div>
          <h3 className="text-white font-bold text-lg">{title}</h3>
        </div>
        <svg
          className={cn(
            "w-6 h-6 text-gold-400 transition-transform",
            isOpen && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-white/10 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

export default SettingsSection;
