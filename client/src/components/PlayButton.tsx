import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

interface PlayButtonProps {
  song: {
    id: string;
    title: string;
    artist_name: string;
    audio_url?: string;
    cover_image_url?: string;
    duration?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

export default function PlayButton({ song, size = 'md', variant = 'default', className = '' }: PlayButtonProps) {
  const { currentSong, isPlaying, play, pause } = useMusicPlayer();
  
  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  const handleClick = () => {
    if (isCurrentSong) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      play(song);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-full ${className}`}
    >
      {isCurrentlyPlaying ? (
        <Pause className={iconSizes[size]} />
      ) : (
        <Play className={iconSizes[size]} />
      )}
    </Button>
  );
}