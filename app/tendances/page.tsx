import { searchTrendsTool } from "@/backend/ai/orchestrator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TendancesPage() {
  const trendsResult = await searchTrendsTool.execute({
    platform: "tiktok",
    region: "montreal",
  });

  const trends = trendsResult.success ? trendsResult.trends : [];
  const authenticTrends = trends.filter((t: any) => t.cultural_score >= 0.7);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zyeute-blue mb-2">
          Tendances à Montréal
        </h1>
        <p className="text-gray-600">
          Le contenu le plus populaire au Québec en ce moment
        </p>
      </div>

      {/* Loading state */}
      {!trendsResult.success && (
        <Card className="bg-zyeute-snow">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Ça charge...</p>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authenticTrends.map((trend: any, index: number) => (
          <Card key={index} className="bg-zyeute-snow border-zyeute-blue/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-zyeute-blue">
                  {trend.title || trend.topic}
                </h3>
                <span className="text-xs bg-zyeute-blue text-white px-2 py-1 rounded">
                  {(trend.cultural_score * 100).toFixed(0)}% 🇨🇦
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">{trend.description}</p>
              {trend.hashtags && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {trend.hashtags.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-zyeute-hydro/20 text-zyeute-blue px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {trend.engagement && (
                <p className="text-xs text-gray-500 mb-4">{trend.engagement}</p>
              )}
              <Button size="sm" className="w-full">
                Voir plus
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {authenticTrends.length === 0 && trendsResult.success && (
        <Card className="bg-zyeute-snow">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              Aucune tendance trouvée pour le moment
            </p>
            <Button>Rafraîchir</Button>
          </CardContent>
        </Card>
      )}

      {/* Footer stats */}
      <div className="mt-8 p-4 bg-zyeute-snow rounded-lg">
        <p className="text-sm text-gray-600">
          {authenticTrends.length} tendances authentiquement québécoises
          trouvées
        </p>
      </div>
    </div>
  );
}
