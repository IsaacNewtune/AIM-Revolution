import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import TipModal from "./TipModal";
import { useState } from "react";

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    nextSong,
    previousSong,
    seekTo,
    setVolume,
  } = useMusicPlayer();

  const [showTipModal, setShowTipModal] = useState(false);

  if (!currentSong) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    seekTo(value[0]);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-gray-800 p-4 z-50">
      
      <div className="flex items-center justify-between max-w-full mx-auto">
        <div className="flex items-center space-x-4 flex-1">
          <img 
            src={currentSong.coverArtUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
            alt="Now Playing" 
            className="w-14 h-14 rounded object-cover" 
          />
          <div>
            <h4 className="font-medium">{currentSong.title}</h4>
            <p className="text-text-secondary text-sm">AI Artist</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowTipModal(true)}
            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-xs rounded-full"
          >
            <i className="fas fa-coins"></i>
          </Button>
        </div>
        
        <div className="flex flex-col items-center flex-1 max-w-md">
          <div className="flex items-center space-x-4 mb-2">
            <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
              <i className="fas fa-random"></i>
            </Button>
            <Button variant="ghost" size="icon" onClick={previousSong} className="text-text-secondary hover:text-white">
              <i className="fas fa-step-backward"></i>
            </Button>
            <Button
              size="icon"
              onClick={togglePlay}
              className="w-10 h-10 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
            >
              <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
            </Button>
            <Button variant="ghost" size="icon" onClick={nextSong} className="text-text-secondary hover:text-white">
              <i className="fas fa-step-forward"></i>
            </Button>
            <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
              <i className="fas fa-redo"></i>
            </Button>
          </div>
          <div className="flex items-center space-x-2 w-full">
            <span className="text-xs text-text-secondary">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-text-secondary">{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 flex-1 justify-end">
          <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
            <i className="fas fa-list"></i>
          </Button>
          <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
            <i className="fas fa-desktop"></i>
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
              <i className="fas fa-volume-down"></i>
            </Button>
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0])}
              className="w-20"
            />
          </div>
        </div>
      </div>
      </div>

      {showTipModal && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          artistId={currentSong.artistId}
          songId={currentSong.id}
        />
      )}
    </>
  );
}
