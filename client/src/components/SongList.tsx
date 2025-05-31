import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Song } from "@shared/schema";

interface SongListProps {
  title?: string;
  endpoint: string;
  queryKey: string[];
}

export default function SongList({ title = "Songs", endpoint, queryKey }: SongListProps) {
  const { playSong, currentSong, isPlaying } = useMusicPlayer();

  const { data: songs = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(endpoint, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch songs');
      return response.json();
    }
  });

  const handlePlaySong = (song: Song) => {
    playSong(song, songs);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card-bg animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div className="grid gap-4">
        {songs.map((song: Song) => (
          <Card key={song.id} className="bg-card-bg hover:bg-gray-800 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={song.coverArtUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                    alt={song.title} 
                    className="w-16 h-16 rounded object-cover" 
                  />
                  <Button
                    size="icon"
                    onClick={() => handlePlaySong(song)}
                    className="absolute inset-0 bg-black/50 hover:bg-black/70 text-white rounded opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <i className={`fas fa-${
                      currentSong?.id === song.id && isPlaying ? 'pause' : 'play'
                    }`}></i>
                  </Button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{song.title}</h3>
                  <p className="text-text-secondary text-sm truncate">
                    {song.description || 'AI Generated Music'}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-text-secondary">
                      {song.aiGenerationMethod?.replace('_', ' ').toUpperCase()}
                    </span>
                    {song.duration && (
                      <span className="text-xs text-text-secondary">
                        {formatDuration(song.duration)}
                      </span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {song.streamCount || 0} streams
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-text-secondary hover:text-white"
                  >
                    <i className="fas fa-heart"></i>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-text-secondary hover:text-white"
                  >
                    <i className="fas fa-plus"></i>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-text-secondary hover:text-white"
                  >
                    <i className="fas fa-ellipsis-h"></i>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {songs.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-music text-4xl text-text-secondary mb-4"></i>
          <p className="text-text-secondary">No songs found</p>
        </div>
      )}
    </div>
  );
}