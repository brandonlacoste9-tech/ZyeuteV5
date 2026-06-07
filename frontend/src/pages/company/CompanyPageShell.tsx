import React from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export function CompanyPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title={title} showBack={true} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card-edge p-6 sm:p-8">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
