import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, List, ChevronUp, Heart, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/hooks/use-toast';

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
    volume,
    isMuted,
    currentTime,
    duration,
    queue,
    currentIndex,
    togglePlay,
    previous,
    next,
    setVolume,
    toggleMute,
    seek
  } = useMusicPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const startY = useRef(0);
  const { toast } = useToast();

  const handleTipAttempt = async (amount: string) => {
    try {
      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          amount,
          songId: currentSong?.id,
          toArtistId: currentSong?.artistId 
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Tip Sent!",
          description: `Successfully tipped $${amount} to ${currentSong?.artistName || currentSong?.artist_name}`,
        });
      } else {
        const error = await response.text();
        toast({
          title: "Tip Failed",
          description: error || "Unable to process tip. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Tip Failed",
        description: "Unable to process tip. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  // Enhanced iOS touch handlers with better sensitivity
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('Touch start detected on iOS at:', e.touches[0].clientY);
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    setDragY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = startY.current - currentY;
    
    console.log('Touch move delta:', deltaY);
    
    // More sensitive detection for iPad
    if (deltaY > 2) {
      e.preventDefault();
      e.stopPropagation();
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const finalDragY = dragY;
    console.log('Touch end, final dragY:', finalDragY);
    setIsDragging(false);
    setDragY(0);
    
    // Even lower threshold - 15px for iPad sensitivity
    if (finalDragY > 15) {
      console.log('Expanding player via touch drag');
      setIsExpanded(true);
    }
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('Mouse down detected');
    setIsDragging(true);
    startY.current = e.clientY;
    setDragY(0);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const deltaY = startY.current - currentY;
    console.log('Mouse move:', deltaY);
    setDragY(deltaY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    console.log('Mouse up, dragY:', dragY);
    setIsDragging(false);
    
    // If dragged up more than 30px, expand
    if (dragY > 30) {
      console.log('Expanding player');
      setIsExpanded(true);
    }
    
    setDragY(0);
  };

  // Add mouse event listeners for desktop
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!currentSong) {
    return null;
  }

  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/95 via-black/95 to-black/95 backdrop-blur-lg z-50 flex flex-col">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-white hover:bg-white/20"
          >
            <ChevronUp className="w-6 h-6 rotate-180" />
          </Button>
        </div>

        {/* Expanded Player Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24">
          {/* Large Album Art */}
          <div className="w-80 h-80 rounded-2xl overflow-hidden bg-primary/20 mb-8 shadow-2xl">
            {(currentSong?.coverArtUrl || currentSong?.cover_art_url) ? (
              <img 
                src={currentSong.coverArtUrl || currentSong.cover_art_url} 
                alt={currentSong?.title || 'Song artwork'}
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
            <h1 className="text-3xl font-bold text-white mb-2">{currentSong?.title}</h1>
            <p className="text-xl text-text-secondary">{currentSong?.artistName || currentSong?.artist_name}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mb-8">
            <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Slider
              value={[currentTime]}
              max={duration || 1}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
          </div>

          {/* Large Player Controls */}
          <div className="flex items-center gap-8 mb-8">
            <Button
              variant="ghost"
              size="lg"
              onClick={previous}
              disabled={currentIndex === 0}
              className="text-white hover:bg-white/20 disabled:opacity-50"
            >
              <SkipBack className="w-8 h-8" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10 ml-1" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={next}
              disabled={currentIndex === queue.length - 1}
              className="text-white hover:bg-white/20 disabled:opacity-50"
            >
              <SkipForward className="w-8 h-8" />
            </Button>
          </div>

          {/* Additional Controls */}
          <div className="flex items-center gap-6">
            {/* Tip Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Heart className="w-5 h-5 mr-2" />
              Tip Artist
            </Button>

            {/* Queue Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQueue(!showQueue)}
              className="text-white hover:bg-white/20"
            >
              <List className="w-5 h-5" />
            </Button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <div className="w-24">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Tip Section */}
          <div id="tip-section" className="w-full max-w-md bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Support {currentSong?.artistName || currentSong?.artist_name}</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleTipAttempt('1')}
              >
                $1
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleTipAttempt('5')}
              >
                $5
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleTipAttempt('10')}
              >
                $10
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-white/30 text-white hover:bg-white/10"
              onClick={() => handleTipAttempt('custom')}
            >
              Custom Amount
            </Button>
          </div>
        </div>

        {/* Queue Panel */}
        {showQueue && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur-lg border-l border-white/20 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Queue</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQueue(false)}
                  className="text-white hover:bg-white/20"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-2">
                {queue.map((song: any, index: number) => (
                  <div
                    key={song.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      index === currentIndex 
                        ? 'bg-primary/20 text-primary' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium truncate">{song.title}</div>
                    <div className="text-sm text-text-secondary truncate">
                      {song.artistName || song.artist_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact Player Bar
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/20 z-40">
      {/* Drag Handle - Enhanced for iPad */}
      <div
        className={`w-full h-6 flex items-center justify-center cursor-pointer transition-all duration-200 ${
          isDragging ? 'bg-primary/30' : 'hover:bg-white/10'
        }`}
        style={{
          transform: isDragging ? `translateY(-${Math.min(dragY, 100)}px)` : 'translateY(0)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={() => {
          console.log('Drag handle clicked');
          setIsExpanded(true);
        }}
      >
        <div className="w-16 h-2 bg-white/60 rounded-full shadow-sm"></div>
      </div>

      {/* Compact Player Content */}
      <div className="flex items-center px-4 py-3 gap-4">
        {/* Song Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary/20 flex-shrink-0">
            {(currentSong?.coverArtUrl || currentSong?.cover_art_url) ? (
              <img 
                src={currentSong.coverArtUrl || currentSong.cover_art_url} 
                alt={currentSong?.title || 'Song artwork'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-6 h-6 text-primary" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-white truncate">{currentSong?.title}</h4>
            <p className="text-xs text-text-secondary truncate">{currentSong?.artistName || currentSong?.artist_name}</p>
          </div>
        </div>

        {/* Player Controls - Centered */}
        <div className="flex items-center justify-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={previous}
            disabled={currentIndex === 0}
            className="text-white hover:bg-white/20 disabled:opacity-50"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={next}
            disabled={currentIndex === queue.length - 1}
            className="text-white hover:bg-white/20 disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Like and Tip Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLiked(!isLiked)}
            className={`transition-colors ${
              isLiked ? 'text-pink-500 hover:text-pink-400' : 'text-white hover:bg-white/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsExpanded(true);
              setTimeout(() => {
                const tipSection = document.getElementById('tip-section');
                if (tipSection) {
                  tipSection.scrollIntoView({ behavior: 'smooth' });
                }
              }, 300);
            }}
            className="text-white hover:bg-white/20 hover:text-green-400"
          >
            <DollarSign className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
          <span>{formatTime(currentTime)}</span>
          <span className="flex-1"></span>
          <span>{formatTime(duration)}</span>
        </div>
        <Slider
          value={[currentTime]}
          max={duration || 1}
          step={1}
          onValueChange={handleSeek}
          className="w-full h-1"
        />
      </div>
    </div>
  );
}