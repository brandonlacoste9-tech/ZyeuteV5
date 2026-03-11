/**
 * VideoTest.tsx
 * Test component to check if Pexels video URLs work
 */

import React, { useState } from "react";
import { VideoPlayer } from "./VideoPlayer";

const testVideos = [
  {
    id: "test-1",
    url: "https://videos.pexels.com/video-files/26872042/12025122_1080_1920_30fps.mp4",
    name: "Pexels Test Video 1"
  },
  {
    id: "test-2", 
    url: "https://videos.pexels.com/video-files/19736479/19736479-hd_1080_1920_30fps.mp4",
    name: "Pexels Test Video 2"
  },
  {
    id: "test-3",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    name: "Google Test Video (CORS-friendly)"
  }
];

export const VideoTest: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState(testVideos[0]);

  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Test de Lecture Vidéo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Player */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Lecteur Vidéo</h2>
          <div className="w-full max-w-md mx-auto">
            <VideoPlayer 
              videoUrl={selectedVideo.url}
              autoPlay={false}
              muted={true}
            />
          </div>
          <div className="text-white">
            <p className="font-medium">URL actuelle:</p>
            <p className="text-sm text-gray-400 break-all">{selectedVideo.url}</p>
          </div>
        </div>

        {/* Video Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Vidéos de Test</h2>
          <div className="space-y-3">
            {testVideos.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  selectedVideo.id === video.id
                    ? "bg-[#d4af37] text-black"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                <div className="font-medium">{video.name}</div>
                <div className="text-sm opacity-80 truncate">{video.url}</div>
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="p-4 bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">État du Test</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Lecteur vidéo chargé</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Test des URLs Pexels</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>URL Google Test disponible</span>
              </li>
            </ul>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
              <li>Sélectionnez une vidéo de test</li>
              <li>Cliquez sur le bouton play dans le lecteur</li>
              <li>Vérifiez si la vidéo se charge et joue</li>
              <li>Testez les contrôles (volume, plein écran, etc.)</li>
            </ol>
          </div>
        </div>
      </div>

      {/* CORS Warning */}
      <div className="mt-8 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-300 mb-2">⚠️ Note sur CORS</h3>
        <p className="text-sm text-yellow-200">
          Les URLs Pexels peuvent avoir des restrictions CORS. Si les vidéos ne se chargent pas,
          essayez l'URL Google Test qui est CORS-friendly.
        </p>
      </div>
    </div>
  );
};