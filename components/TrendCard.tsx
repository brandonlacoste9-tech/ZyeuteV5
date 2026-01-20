import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TrendCardProps {
  title: string;
  description?: string;
  culturalScore: number;
  hashtags?: string[];
  engagement?: string;
  platform?: string;
  onViewMore?: () => void;
}

export function TrendCard({
  title,
  description,
  culturalScore,
  hashtags = [],
  engagement,
  platform,
  onViewMore,
}: TrendCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-zyeute-hydro";
    return "bg-orange-500";
  };

  return (
    <Card className="bg-zyeute-snow border-zyeute-blue/20 hover:border-zyeute-blue/40 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-zyeute-blue line-clamp-2">
            {title}
          </h3>
          <div className="flex-shrink-0">
            <div
              className={`${getScoreColor(culturalScore)} text-white text-xs font-bold px-2 py-1 rounded-full`}
            >
              {(culturalScore * 100).toFixed(0)}% 🇨🇦
            </div>
          </div>
        </div>
        {platform && (
          <span className="text-xs text-gray-500">
            {platform.toUpperCase()}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-gray-700 line-clamp-3">{description}</p>
        )}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hashtags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-zyeute-hydro/20 text-zyeute-blue px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {engagement && (
          <div className="text-xs text-gray-500">📊 {engagement}</div>
        )}
        <Button size="sm" className="w-full" onClick={onViewMore}>
          Voir plus
        </Button>
      </CardContent>
    </Card>
  );
}
