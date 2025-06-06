import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  Share2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface Song {
  id: string;
  title: string;
  artistName: string;
  coverArtUrl?: string;
  duration?: number;
  genre?: string;
}

interface MusicPlayerProps {
  currentSong: Song | null;
  playlist: Song[];
  onSongChange: (song: Song) => void;
  isVisible: boolean;
}

export default function MusicPlayer({ 
  currentSong, 
  playlist, 
  onSongChange, 
  isVisible 
}: MusicPlayerProps) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [audioQuality, setAudioQuality] = useState<{ bitrate: number; quality: string }>({ bitrate: 128, quality: 'free' });
  const [isLiked, setIsLiked] = useState(false);

  // Get streaming URL with appropriate bitrate for user's subscription
  const getStreamingUrl = async (songId: string) => {
    try {
      const response = await apiRequest('GET', `/api/songs/${songId}/stream`);
      const data = await response.json();
      setAudioQuality({ bitrate: data.bitrate, quality: data.quality });
      return data.streamingUrl;
    } catch (error) {
      console.error('Error getting streaming URL:', error);
      return null;
    }
  };

  // Load and play song
  const loadSong = async (song: Song) => {
    if (!audioRef.current || !song) return;

    const streamingUrl = await getStreamingUrl(song.id);
    if (streamingUrl) {
      audioRef.current.src = streamingUrl;
      audioRef.current.load();
    }
  };

  // Play/pause toggle
  const togglePlayPause = async () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  // Next song
  const nextSong = () => {
    if (!currentSong || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    let nextIndex;

    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    onSongChange(playlist[nextIndex]);
  };

  // Previous song
  const previousSong = () => {
    if (!currentSong || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    let prevIndex;

    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    }

    onSongChange(playlist[prevIndex]);
  };

  // Seek to position
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Change volume
  const changeVolume = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  // Format time display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Toggle repeat mode
  const toggleRepeatMode = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all' || playlist.length > 1) {
        nextSong();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, playlist]);

  // Load song when current song changes
  useEffect(() => {
    if (currentSong) {
      loadSong(currentSong);
    }
  }, [currentSong]);

  if (!isVisible || !currentSong) return null;

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 bg-card-bg border-t border-gray-800 rounded-none">
      <CardContent className="p-4">
        <audio ref={audioRef} />
        
        <div className="flex items-center justify-between">
          {/* Song Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="w-16 h-16 bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden">
              {currentSong.coverArtUrl ? (
                <img 
                  src={currentSong.coverArtUrl} 
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fas fa-music text-gray-600"></i>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold truncate">{currentSong.title}</h4>
              <p className="text-sm text-text-secondary truncate">{currentSong.artistName}</p>
              <div className="flex items-center space-x-2 mt-1">
                {currentSong.genre && (
                  <Badge variant="secondary" className="text-xs">
                    {currentSong.genre}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {audioQuality.bitrate}kbps
                </Badge>
                <Badge 
                  variant={audioQuality.quality === 'vip' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {audioQuality.quality.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsShuffled(!isShuffled)}
                className={isShuffled ? "text-ai-purple" : ""}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={previousSong}>
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={togglePlayPause}
                className="rounded-full w-12 h-12"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
              
              <Button variant="ghost" size="sm" onClick={nextSong}>
                <SkipForward className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRepeatMode}
                className={repeatMode !== 'none' ? "text-ai-purple" : ""}
              >
                <Repeat className="h-4 w-4" />
                {repeatMode === 'one' && (
                  <span className="text-xs ml-1">1</span>
                )}
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-2 w-full max-w-md">
              <span className="text-xs text-text-secondary w-10">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={(value) => seekTo(value[0])}
                className="flex-1"
              />
              <span className="text-xs text-text-secondary w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume and Actions */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
              className={isLiked ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={toggleMute}>
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[volume]}
                max={1}
                step={0.1}
                onValueChange={changeVolume}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}