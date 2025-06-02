import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    queue,
    currentIndex,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
  } = useMusicPlayer();

  const [showQueue, setShowQueue] = useState(false);

  if (!currentSong) return null;

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Main Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-card-border backdrop-blur-md z-50">
        <div className="flex items-center justify-between px-4 py-3 max-w-full">
          {/* Song Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary/20 flex-shrink-0">
              {(currentSong.coverArtUrl || currentSong.cover_art_url) ? (
                <img 
                  src={currentSong.coverArtUrl || currentSong.cover_art_url} 
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-white truncate">{currentSong.title}</h4>
              <p className="text-xs text-text-secondary truncate">{currentSong.artistName || currentSong.artist_name}</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={previous}
                disabled={currentIndex === 0}
                className="text-white hover:text-primary"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:text-primary w-10 h-10 rounded-full bg-primary/20"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={next}
                disabled={currentIndex >= queue.length - 1}
                className="text-white hover:text-primary"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-text-secondary min-w-[35px]">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-text-secondary min-w-[35px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Queue Controls */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQueue(!showQueue)}
              className="text-white hover:text-primary"
            >
              <List className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:text-primary"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <div className="fixed bottom-16 right-4 w-80 max-h-96 bg-card-bg border border-card-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-card-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Queue</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQueue(false)}
                className="text-text-secondary hover:text-white"
              >
                ×
              </Button>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-64">
            {queue.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className={`flex items-center gap-3 p-3 hover:bg-card-hover transition-colors ${
                  index === currentIndex ? 'bg-primary/10 border-l-2 border-primary' : ''
                }`}
              >
                <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {song.cover_art_url ? (
                    <img 
                      src={song.cover_art_url} 
                      alt={song.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Play className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{song.title}</p>
                  <p className="text-xs text-text-secondary truncate">{song.artist_name}</p>
                </div>
                {index === currentIndex && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}