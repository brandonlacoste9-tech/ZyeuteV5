import React from "react";
import { TrendingUp, MapPin, Users } from "lucide-react";

interface TrendingTag {
  tag: string;
  count: number;
  trending: boolean;
  region?: string;
  category: "food" | "culture" | "sports" | "politics" | "nature";
}

export const QuebecHashtags: React.FC = () => {
  const trendingTags: TrendingTag[] = [
    {
      tag: "#Poutine",
      count: 1243,
      trending: true,
      region: "Québec",
      category: "food",
    },
    {
      tag: "#Québec",
      count: 892,
      trending: true,
      region: "Québec",
      category: "culture",
    },
    {
      tag: "#Montréal",
      count: 756,
      trending: false,
      region: "Montréal",
      category: "culture",
    },
    {
      tag: "#GoHabsGo",
      count: 543,
      trending: true,
      region: "Montréal",
      category: "sports",
    },
    {
      tag: "#CultureQC",
      count: 432,
      trending: false,
      region: "Québec",
      category: "culture",
    },
    {
      tag: "#FEQ2024",
      count: 321,
      trending: true,
      region: "Québec",
      category: "culture",
    },
    {
      tag: "#Gaspésie",
      count: 287,
      trending: false,
      region: "Gaspésie",
      category: "nature",
    },
    {
      tag: "#Tourtière",
      count: 254,
      trending: false,
      region: "Québec",
      category: "food",
    },
  ];

  const categoryIcons: Record<TrendingTag["category"], string> = {
    food: "🍴",
    culture: "🎭",
    sports: "🏒",
    politics: "🏛️",
    nature: "🌲",
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-gold-400" />
            Hashtags tendance au Québec
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Découvrez ce qui buzz en ce moment
          </p>
        </div>
        <div className="flex items-center text-sm text-gray-400">
          <MapPin className="w-4 h-4 mr-1" />
          <span>Mis à jour à l'instant</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {trendingTags.map((item) => (
          <div
            key={item.tag}
            className={`p-4 rounded-xl border ${
              item.trending
                ? "border-gold-500/40 bg-gradient-to-br from-dark-800 to-gold-500/5"
                : "border-dark-700 bg-dark-800/50"
            } hover:border-gold-500/60 hover:shadow-lg hover:shadow-gold-500/10 transition-all duration-300 cursor-pointer group`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-lg group-hover:text-gold-300 transition-colors">
                  {item.tag}
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-gray-400">
                    {categoryIcons[item.category]} {item.category}
                  </span>
                  {item.region && (
                    <span className="text-xs text-gray-500 ml-2 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {item.region}
                    </span>
                  )}
                </div>
              </div>
              {item.trending && (
                <div className="flex items-center text-xs text-gold-400 bg-gold-500/10 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Tendance
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-dark-700/50">
              <div className="flex items-center text-sm text-gray-400">
                <Users className="w-4 h-4 mr-2" />
                <span>{item.count.toLocaleString()} posts</span>
              </div>
              <button className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                Suivre →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center mx-auto">
          Voir plus de tendances
          <TrendingUp className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};
