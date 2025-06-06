import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  TrendingUp, 
  Heart, 
  Play, 
  Music,
  Filter,
  Users,
  Star,
  Clock,
  Headphones,
  Sparkles,
  Bot
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Song {
  id: string;
  title: string;
  artistName: string;
  artistId: number;
  genre: string;
  mood: string;
  aiGenerationMethod: string;
  tags: string[];
  streamCount: number;
  coverArtUrl?: string;
  duration?: number;
  createdAt: string;
}

interface DiscoveryFilters {
  query?: string;
  genre?: string;
  mood?: string;
  aiMethod?: string;
  sortBy?: string;
  tags?: string[];
}

export default function AdvancedDiscovery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeTab, setActiveTab] = useState("discover");

  // Fetch discovered songs
  const { data: discoveredSongs = [], isLoading: isDiscovering } = useQuery({
    queryKey: ['/api/songs/discover', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
      });
      
      const response = await apiRequest('GET', `/api/songs/discover?${params}`);
      return await response.json();
    }
  });

  // Fetch trending songs
  const { data: trendingSongs = [] } = useQuery({
    queryKey: ['/api/songs/trending'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/songs/trending');
      return await response.json();
    }
  });

  // Fetch personalized recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/songs/recommendations'],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiRequest('GET', '/api/songs/recommendations');
      return await response.json();
    },
    enabled: !!user
  });

  // Fetch genre and mood stats
  const { data: genreStats = [] } = useQuery({
    queryKey: ['/api/analytics/genres'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/genres');
      return await response.json();
    }
  });

  const { data: moodStats = [] } = useQuery({
    queryKey: ['/api/analytics/moods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/moods');
      return await response.json();
    }
  });

  // Play song mutation
  const playMutation = useMutation({
    mutationFn: async (songId: string) => {
      const response = await apiRequest('POST', `/api/songs/${songId}/play`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Playback Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Like song mutation
  const likeMutation = useMutation({
    mutationFn: async (songId: string) => {
      const response = await apiRequest('POST', `/api/songs/${songId}/like`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      toast({
        title: "Song Liked",
        description: "Added to your favorites",
      });
    }
  });

  // Handle filter changes
  const updateFilter = (key: keyof DiscoveryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // AI generation method labels
  const aiMethodLabels = {
    'fully_ai': 'Fully AI Generated',
    'ai_assisted': 'AI-Assisted',
    'ai_post_processing': 'AI Post-Processing'
  };

  // Song card component
  const SongCard = ({ song }: { song: Song }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-16 h-16 bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden relative">
            {song.coverArtUrl ? (
              <img 
                src={song.coverArtUrl} 
                alt={song.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-6 w-6 text-gray-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  playMutation.mutate(song.id);
                  setSelectedSong(song);
                }}
                className="rounded-full"
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{song.title}</h3>
            <p className="text-sm text-text-secondary truncate">{song.artistName}</p>
            
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {song.genre}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {song.mood}
              </Badge>
              <Badge variant="outline" className="text-xs flex items-center space-x-1">
                <Bot className="h-3 w-3" />
                <span>{aiMethodLabels[song.aiGenerationMethod as keyof typeof aiMethodLabels]}</span>
              </Badge>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-xs text-text-secondary">
                <span className="flex items-center space-x-1">
                  <Headphones className="h-3 w-3" />
                  <span>{song.streamCount.toLocaleString()}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(song.duration)}</span>
                </span>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => likeMutation.mutate(song.id)}
                className="h-6 w-6 p-0"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discover Music</h1>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Sparkles className="h-4 w-4" />
          <span>AI-Powered Discovery</span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="recommendations">For You</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Discovery Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by title, artist, or keywords..."
                    value={filters.query || ''}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={() => setFilters({})}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select onValueChange={(value) => updateFilter('genre', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genres</SelectItem>
                    {genreStats.map((genre: any) => (
                      <SelectItem key={genre.name} value={genre.name}>
                        {genre.name} ({genre.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => updateFilter('mood', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Moods</SelectItem>
                    {moodStats.map((mood: any) => (
                      <SelectItem key={mood.name} value={mood.name}>
                        {mood.name} ({mood.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => updateFilter('aiMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="AI Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Methods</SelectItem>
                    <SelectItem value="fully_ai">Fully AI Generated</SelectItem>
                    <SelectItem value="ai_assisted">AI-Assisted</SelectItem>
                    <SelectItem value="ai_post_processing">AI Post-Processing</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="most_streamed">Most Streamed</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Discovered Songs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Discovered Songs</span>
                <Badge variant="secondary">
                  {discoveredSongs.length} results
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDiscovering ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ai-purple"></div>
                </div>
              ) : discoveredSongs.length > 0 ? (
                <div className="grid gap-4">
                  {discoveredSongs.map((song: Song) => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No songs found with current filters</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Trending Now</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {trendingSongs.map((song: Song, index: number) => (
                  <div key={song.id} className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-ai-purple text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <SongCard song={song} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Personalized for You</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="grid gap-4">
                  {recommendations.map((song: Song) => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Sign in to get personalized recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Genres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {genreStats.slice(0, 10).map((genre: any) => (
                    <div key={genre.name} className="flex items-center justify-between">
                      <span className="font-medium">{genre.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-ai-purple rounded-full"
                            style={{ 
                              width: `${(genre.count / Math.max(...genreStats.map((g: any) => g.count))) * 100}%` 
                            }}
                          />
                        </div>
                        <Badge variant="secondary">{genre.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Moods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {moodStats.slice(0, 10).map((mood: any) => (
                    <div key={mood.name} className="flex items-center justify-between">
                      <span className="font-medium">{mood.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-ai-green rounded-full"
                            style={{ 
                              width: `${(mood.count / Math.max(...moodStats.map((m: any) => m.count))) * 100}%` 
                            }}
                          />
                        </div>
                        <Badge variant="secondary">{mood.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}