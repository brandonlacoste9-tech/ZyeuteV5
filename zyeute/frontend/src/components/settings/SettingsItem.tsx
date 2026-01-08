/**
 * SettingsItem - Reusable settings item component
 */

import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

type SettingsItemType = "link" | "toggle" | "select" | "info";

interface SettingsItemProps {
  type: SettingsItemType;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  to?: string;
  value?: boolean | string;
  options?: Array<{ label: string; value: string }>;
  onChange?: (value: boolean | string) => void;
  className?: string;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  type,
  label,
  description,
  icon,
  to,
  value,
  options,
  onChange,
  className,
}) => {
  const baseClasses =
    "flex items-center justify-between p-4 hover:bg-white/5 transition-colors";

  // Link type
  if (type === "link" && to) {
    return (
      <Link to={to} className={cn(baseClasses, className)}>
        <div className="flex items-center gap-3 flex-1">
          {icon && <span className="text-xl">{icon}</span>}
          <div>
            <p className="text-white font-semibold">{label}</p>
            {description && (
              <p className="text-white/60 text-sm mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <svg
          className="w-5 h-5 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    );
  }

  // Toggle type
  if (type === "toggle") {
    return (
      <div className={cn(baseClasses, className)}>
        <div className="flex items-center gap-3 flex-1">
          {icon && <span className="text-xl">{icon}</span>}
          <div>
            <p className="text-white font-semibold">{label}</p>
            {description && (
              <p className="text-white/60 text-sm mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onChange?.(!value)}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors",
            value ? "bg-gold-500" : "bg-white/20",
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
              value ? "left-6" : "left-0.5",
            )}
          />
        </button>
      </div>
    );
  }

  // Select type
  if (type === "select" && options) {
    return (
      <div className={cn(baseClasses, className)}>
        <div className="flex items-center gap-3 flex-1">
          {icon && <span className="text-xl">{icon}</span>}
          <div>
            <p className="text-white font-semibold">{label}</p>
            {description && (
              <p className="text-white/60 text-sm mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <select
          value={value as string}
          onChange={(e) => onChange?.(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-gold-400"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Info type (read-only)
  return (
    <div className={cn(baseClasses, "cursor-default", className)}>
      <div className="flex items-center gap-3 flex-1">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <p className="text-white font-semibold">{label}</p>
          {description && (
            <p className="text-white/60 text-sm mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {value && <p className="text-white/60 text-sm">{value}</p>}
    </div>
  );
};

export default SettingsItem;
