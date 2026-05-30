interface CulturalScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function CulturalScoreBadge({
  score,
  size = "md",
  showLabel = true,
}: CulturalScoreBadgeProps) {
  // Determine badge color based on score
  const getColor = () => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-zyeute-hydro";
    if (score >= 0.3) return "bg-orange-500";
    return "bg-zyeute-alert";
  };

  // Determine textual label
  const getLabel = () => {
    if (score >= 0.8) return "Très québécois";
    if (score >= 0.6) return "Québécois";
    if (score >= 0.3) return "Acceptable";
    return "Non authentique";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`${getColor()} text-white font-bold rounded-full ${sizeClasses[size]}`}
      >
        {(score * 100).toFixed(0)}% 🇨🇦
      </div>
      {showLabel && <span className="text-xs text-gray-600">{getLabel()}</span>}
    </div>
  );
}
