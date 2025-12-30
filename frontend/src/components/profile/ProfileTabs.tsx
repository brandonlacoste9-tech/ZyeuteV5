"use client";

import React, { useState } from "react";
import { Grid, Heart, Star, Award } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs: Tab[] = [
    { id: "posts", label: "Publications", icon: Grid },
    { id: "likes", label: "Coups de coeur", icon: Heart },
    { id: "reputation", label: "Réputation", icon: Star },
    { id: "badges", label: "Badges", icon: Award },
  ];

  return (
    <div className="w-full border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 min-w-[100px] flex flex-col items-center gap-2 py-4 px-2 text-sm font-medium transition-all relative
                ${isActive ? "text-leather-primary" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
              `}
            >
              <Icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
              <span>{tab.label}</span>

              {/* Active Indicator Line (Gold) */}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-primary animate-in fade-in slide-in-from-left-1/2 duration-300" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
