import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Heart, DollarSign, Clock, User, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch';
import TipModal from '@/components/TipModal';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useAuth } from '@/hooks/useAuth';

export default function DiscoverPage() {
  const { user } = useAuth();
  const { play } = useMusicPlayer();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    genre: '',
    mood: '',
    aiMethod: '',
    sortBy: 'newest',
    tags: []
  });
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipTarget, setTipTarget] = useState<{ type: 'track' | 'artist'; data: any } | null>(null);

  // Fetch songs based on search filters
  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['/api/songs/discover', searchFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      const response = await fetch(`/api/songs/discover?${params}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Fetch trending songs
  const { data: trendingSongs = [] } = useQuery({
    queryKey: ['/api/songs/trending'],
  });

  // Fetch featured genres
  const { data: genreStats = [] } = useQuery({
    queryKey: ['/api/genres/stats'],
  });

  const handlePlay = (song: any) => {
    play(song);
    // Record stream
    fetch('/api/streams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ songId: song.id }),
    });
  };

  const handleTip = (type: 'track' | 'artist', data: any) => {
    setTipTarget({ type, data });
    setShowTipModal(true);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white">
        <Header userType={user?.accountType || 'listener'} />
        <div className="flex">
          <Sidebar userType={user?.accountType || 'listener'} />
          <div className="flex-1 lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-ai-purple border-t-transparent rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header userType={user?.accountType || 'listener'} />
      <div className="flex">
        <Sidebar userType={user?.accountType || 'listener'} />
        
        <div className="flex-1 lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Discover AI Music</h1>
              <p className="text-text-secondary">
                Explore the latest AI-generated music from talented creators worldwide
              </p>
            </div>

            {/* Advanced Search */}
            <AdvancedSearch 
              onSearch={setSearchFilters} 
              className="mb-8"
            />

            {/* Trending Section */}
            {trendingSongs.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 mr-2 text-ai-purple" />
                  <h2 className="text-2xl font-bold">Trending Now</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trendingSongs.slice(0, 8).map((song: any, index: number) => (
                    <Card key={song.id} className="bg-card-bg hover:bg-gray-800/50 transition-colors group">
                      <CardContent className="p-4">
                        <div className="relative mb-3">
                          <img 
                            src={song.coverArtUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"} 
                            alt={song.title}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="bg-ai-purple/80 text-white">
                              #{index + 1}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => handlePlay(song)}
                            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-ai-purple/80 hover:bg-ai-purple opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Play className="w-5 h-5" />
                          </Button>
                        </div>
                        <h3 className="font-semibold truncate mb-1">{song.title}</h3>
                        <p className="text-text-secondary text-sm truncate mb-2">{song.artistName}</p>
                        <div className="flex items-center justify-between text-sm text-text-secondary">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(song.duration)}
                          </span>
                          <span>{song.streamCount?.toLocaleString() || 0} plays</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Genre Stats */}
            {genreStats.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Popular Genres</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {genreStats.map((genre: any) => (
                    <Card 
                      key={genre.name} 
                      className="bg-card-bg hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => setSearchFilters(prev => ({ ...prev, genre: genre.name }))}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-ai-purple mb-1">
                          {genre.count}
                        </div>
                        <div className="text-sm font-medium">{genre.name}</div>
                        <div className="text-xs text-text-secondary">tracks</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Search Results */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {searchFilters.query ? `Search Results for "${searchFilters.query}"` : 'All Music'}
                </h2>
                <div className="text-text-secondary">
                  {songs.length} {songs.length === 1 ? 'track' : 'tracks'} found
                </div>
              </div>

              {songs.length === 0 ? (
                <Card className="bg-card-bg">
                  <CardContent className="p-8 text-center">
                    <div className="text-text-secondary mb-4">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No tracks found</h3>
                      <p>Try adjusting your search filters or browse our trending music above.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {songs.map((song: any) => (
                    <Card key={song.id} className="bg-card-bg hover:bg-gray-800/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Album Art */}
                          <div className="relative group">
                            <img 
                              src={song.coverArtUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop"} 
                              alt={song.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <Button
                              onClick={() => handlePlay(song)}
                              className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-ai-purple/80 hover:bg-ai-purple opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Song Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{song.title}</h3>
                            <p className="text-text-secondary text-sm truncate">{song.artistName}</p>
                            <div className="flex items-center gap-4 mt-1">
                              {song.genre && (
                                <Badge variant="outline" className="text-xs">
                                  {song.genre}
                                </Badge>
                              )}
                              {song.mood && (
                                <Badge variant="outline" className="text-xs">
                                  {song.mood}
                                </Badge>
                              )}
                              <span className="text-xs text-text-secondary">
                                {song.aiGenerationMethod?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="text-right text-sm text-text-secondary">
                            <div>{formatDuration(song.duration)}</div>
                            <div>{song.streamCount?.toLocaleString() || 0} plays</div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-text-secondary hover:text-red-400"
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTip('track', song)}
                              className="text-text-secondary hover:text-green-400"
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Tip Modal */}
      <TipModal 
        open={showTipModal} 
        onOpenChange={setShowTipModal} 
        target={tipTarget} 
      />
    </div>
  );
}