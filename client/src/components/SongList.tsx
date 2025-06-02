import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Heart, Plus, MoreHorizontal } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import PlayButton from "@/components/PlayButton";

interface SongListProps {
  title?: string;
  endpoint: string;
  queryKey: string[];
}

export default function SongList({ title = "Songs", endpoint, queryKey }: SongListProps) {
  const { playQueue, addToQueue } = useMusicPlayer();

  const { data: songs = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(endpoint, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch songs');
      return response.json();
    }
  });

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playQueue(songs, 0);
    }
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {songs.length > 0 && (
          <Button onClick={handlePlayAll} className="bg-primary hover:bg-primary/80">
            Play All
          </Button>
        )}
      </div>
      <div className="grid gap-4">
        {songs.map((song: any) => (
          <Card key={song.id} className="bg-card-bg hover:bg-card-hover transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center">
                    {song.cover_art_url ? (
                      <img 
                        src={song.cover_art_url} 
                        alt={song.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Music className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayButton 
                      song={song} 
                      size="md" 
                      variant="ghost" 
                      className="text-white hover:text-primary bg-transparent" 
                    />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{song.title}</h3>
                  <p className="text-text-secondary text-sm truncate">
                    {song.artist_name || 'Unknown Artist'}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-text-secondary">
                      {song.genre || 'AI Generated'}
                    </span>
                    {song.duration && (
                      <span className="text-xs text-text-secondary">
                        {formatDuration(song.duration)}
                      </span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {song.stream_count || 0} streams
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-secondary hover:text-white"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addToQueue(song)}
                    className="text-text-secondary hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-secondary hover:text-white"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {songs.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary">No songs found</p>
        </div>
      )}
    </div>
  );
}