import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Play, TrendingUp, Sparkles } from "lucide-react";
import MusicPlayer from "@/components/MusicPlayer";
import TipModal from "@/components/TipModal";

export default function Discover() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [tipTarget, setTipTarget] = useState<{ type: 'track' | 'artist'; data: any } | null>(null);

  // Fetch all songs with filters
  const { data: allSongs = [], isLoading: songsLoading } = useQuery({
    queryKey: ["/api/songs", { search: searchTerm, sortBy, limit: 50 }],
  });

  // Fetch trending songs
  const { data: trendingSongs = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/songs/trending"],
  });

  // Fetch recommended songs
  const { data: recommendedSongs = [], isLoading: recommendedLoading } = useQuery({
    queryKey: ["/api/songs/recommendations"],
  });

  const handleSearch = () => {
    // Trigger refetch with current search term
  };

  const handlePlaySong = (song: any) => {
    setSelectedSong(song);
  };

  const handleTip = (type: 'track' | 'artist', data: any) => {
    setTipTarget({ type, data });
    setTipModalOpen(true);
  };

  const SongCard = ({ song }: { song: any }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {song.coverArtUrl ? (
            <img 
              src={song.coverArtUrl} 
              alt={song.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{song.title}</h3>
            <p className="text-gray-600 text-sm truncate">{song.description}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {song.aiGenerationMethod?.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-xs text-gray-500">
                {song.streamCount || 0} plays
              </span>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              size="sm"
              onClick={() => handlePlaySong(song)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="w-4 h-4 mr-1" />
              Play
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTip('track', song)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Tip
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Discover AI Music
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore the latest AI-generated tracks, trending hits, and personalized recommendations
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search for songs, artists, or genres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Discovery Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Songs</TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="recommended">For You</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">All Songs</h2>
            <span className="text-gray-500">{allSongs.length} tracks</span>
          </div>
          
          {songsLoading ? (
            <div className="grid gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {allSongs.map((song: any) => (
                <SongCard key={song.id} song={song} />
              ))}
              {allSongs.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No songs found. Try adjusting your search or filters.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Trending Now</h2>
            <span className="text-gray-500">{trendingSongs.length} tracks</span>
          </div>
          
          {trendingLoading ? (
            <div className="grid gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {trendingSongs.map((song: any) => (
                <SongCard key={song.id} song={song} />
              ))}
              {trendingSongs.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No trending songs available yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Recommended for You</h2>
            <span className="text-gray-500">{recommendedSongs.length} tracks</span>
          </div>
          
          {recommendedLoading ? (
            <div className="grid gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {recommendedSongs.map((song: any) => (
                <SongCard key={song.id} song={song} />
              ))}
              {recommendedSongs.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No recommendations available yet. Stream some music to get personalized suggestions!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Music Player */}
      {selectedSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <MusicPlayer song={selectedSong} onTip={handleTip} />
        </div>
      )}

      {/* Tip Modal */}
      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        target={tipTarget}
      />
    </div>
  );
}