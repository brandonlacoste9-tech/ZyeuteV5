/**
 * 💬 Messages / DMs Page - Leather Wallet Design
 * Direct messaging interface for Zyeuté users
 * ⚜️ Fleur-de-lis navigation hub
 */

import React from "react";
import { ChatWalletUI } from "@/components/features/ChatWalletUI";
import { BottomNav } from "@/components/BottomNav";

export const Messages: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0D0B08] pb-20">
      <ChatWalletUI />
      <BottomNav />
    </div>
  );
};

export default Messages;
