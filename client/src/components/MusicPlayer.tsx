import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, List, ChevronUp } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  if (!currentSong) return null;

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  // Drag handlers for mobile touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    setDragY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = startY.current - currentY;
    setDragY(deltaY);
    
    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If dragged up more than 50px, expand
    if (dragY > 50) {
      setIsExpanded(true);
    }
    
    setDragY(0);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    setDragY(0);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const deltaY = startY.current - currentY;
    setDragY(deltaY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If dragged up more than 50px, expand
    if (dragY > 50) {
      setIsExpanded(true);
    }
    
    setDragY(0);
  };

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragY]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Expanded Player Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex flex-col">
          {/* Drag Handle */}
          <div className="w-full flex justify-center py-4">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-12 h-1.5 bg-gray-400 rounded-full hover:bg-gray-300 transition-colors"
            />
          </div>
          
          {/* Expanded Player Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24">
            {/* Large Album Art */}
            <div className="w-80 h-80 rounded-2xl overflow-hidden bg-primary/20 mb-8 shadow-2xl">
              {(currentSong.coverArtUrl || currentSong.cover_art_url) ? (
                <img 
                  src={currentSong.coverArtUrl || currentSong.cover_art_url} 
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-24 h-24 text-primary" />
                </div>
              )}
            </div>

            {/* Song Info */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">{currentSong.title}</h1>
              <p className="text-xl text-text-secondary">{currentSong.artistName || currentSong.artist_name}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mb-8">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm text-text-secondary min-w-[40px]">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-sm text-text-secondary min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center gap-6 mb-8">
              <Button
                variant="ghost"
                size="lg"
                onClick={previous}
                disabled={currentIndex === 0}
                className="text-white hover:text-primary"
              >
                <SkipBack className="w-8 h-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={togglePlay}
                className="text-white hover:text-primary w-16 h-16 rounded-full bg-primary/20"
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10" />
                ) : (
                  <Play className="w-10 h-10" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={next}
                disabled={currentIndex >= queue.length - 1}
                className="text-white hover:text-primary"
              >
                <SkipForward className="w-8 h-8" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4 w-full max-w-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:text-primary"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-card-border backdrop-blur-md z-50">
        {/* Drag Handle */}
        <div className="w-full flex justify-center py-2">
          <div
            className="w-12 h-1.5 bg-gray-500 rounded-full hover:bg-gray-400 transition-colors cursor-pointer select-none"
            style={{
              transform: isDragging ? `translateY(-${Math.min(dragY, 100)}px)` : 'none',
              opacity: isDragging ? 0.8 : 1
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onClick={() => !isDragging && setIsExpanded(true)}
            aria-label="Drag up to expand player"
          />
        </div>
        
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