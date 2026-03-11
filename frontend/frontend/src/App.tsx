import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { LazyeuteFeed } from "@/components/LazyeuteFeed";
import { VideoTest } from "@/components/VideoTest";
import { ChatModal } from "@/components/ChatModal";
import { ToastProvider, useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";
import { IoChatbubbleOutline } from "react-icons/io5";

function App() {
  const [showChat, setShowChat] = React.useState(false);

  return (
    <GuestModeProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-black">
            <Routes>
              <Route path="/" element={<Navigate to="/lazyeute" replace />} />
              <Route path="/lazyeute" element={<LazyeuteFeed />} />
              <Route path="/feed" element={<Navigate to="/lazyeute" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/test-video" element={<VideoTest />} />
              <Route path="*" element={<Navigate to="/lazyeute" replace />} />
            </Routes>

            {/* Chat Button (Floating) */}
            <button
              onClick={() => setShowChat(true)}
              className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-[#d4af37] rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform active:scale-95"
            >
              <IoChatbubbleOutline className="w-7 h-7" />
            </button>

            {/* Chat Modal */}
            {showChat && <ChatModal onClose={() => setShowChat(false)} />}
          </div>
        </BrowserRouter>
      </ToastProvider>
    </GuestModeProvider>
  );
}

function LoginPage() {
  const { showToast } = useToast();

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Zyeuté</h1>
        <p className="text-gray-400 mb-8">La plateforme sociale française</p>
        <button
          onClick={() => showToast("Bienvenue! 🦫", "success")}
          className="px-8 py-3 bg-[#d4af37] text-black rounded-full font-semibold hover:bg-[#c5a028] transition-colors"
        >
          Continuer en tant qu'invité
        </button>
      </div>
    </div>
  );
}

export default App;
