import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Music, TrendingUp, Heart, User, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SongList from "@/components/SongList";
import { apiRequest } from "@/lib/queryClient";

interface SearchResult {
  songs: any[];
  artists: any[];
  playlists: any[];
  query: string;
  totalResults: number;
}

export default function Discover() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const [searchType, setSearchType] = useState("all");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search query
  const { data: searchResults, isLoading: isSearchLoading } = useQuery<SearchResult>({
    queryKey: ["/api/search", debouncedSearchTerm, searchType],
    enabled: debouncedSearchTerm.length > 0,
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedSearchTerm,
        type: searchType
      });
      const response = await apiRequest("GET", `/api/search?${params}`);
      return response.json();
    }
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.length > 0) {
      setActiveTab("search");
    } else {
      setActiveTab("trending");
    }
  };

  const renderSearchResults = () => {
    if (isSearchLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!searchResults || searchResults.totalResults === 0) {
      return (
        <div className="text-center py-12">
          <Music className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No results found</h3>
          <p className="text-text-secondary">Try searching for different keywords or check your spelling</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {searchResults.songs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-white">Songs</h3>
              <Badge variant="secondary">{searchResults.songs.length}</Badge>
            </div>
            <div className="grid gap-4">
              {searchResults.songs.map((song: any) => (
                <Card key={song.id} className="bg-card-bg border-card-border hover:bg-card-hover transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{song.title}</h4>
                        <p className="text-text-secondary">{song.artist_name}</p>
                        <p className="text-sm text-text-secondary">{song.genre}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {searchResults.artists.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-white">Artists</h3>
              <Badge variant="secondary">{searchResults.artists.length}</Badge>
            </div>
            <div className="grid gap-4">
              {searchResults.artists.map((artist: any) => (
                <Card key={artist.id} className="bg-card-bg border-card-border hover:bg-card-hover transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{artist.name}</h4>
                        <p className="text-text-secondary">{artist.genre}</p>
                        <p className="text-sm text-text-secondary">{artist.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {searchResults.playlists.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <List className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-white">Playlists</h3>
              <Badge variant="secondary">{searchResults.playlists.length}</Badge>
            </div>
            <div className="grid gap-4">
              {searchResults.playlists.map((playlist: any) => (
                <Card key={playlist.id} className="bg-card-bg border-card-border hover:bg-card-hover transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <List className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{playlist.title}</h4>
                        <p className="text-text-secondary">by {playlist.first_name} {playlist.last_name}</p>
                        {playlist.description && (
                          <p className="text-sm text-text-secondary">{playlist.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header userType={user?.accountType || "listener"} />
      <div className="flex">
        <Sidebar userType={user?.accountType || "listener"} />
        
        <div className="flex-1 lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
          <div className="container mx-auto px-6 py-8 max-w-6xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Discover Music</h1>
              <p className="text-text-secondary">Explore AI-generated music from talented artists</p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex-1 min-w-80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-4 w-4" />
                  <Input
                    placeholder="Search songs, artists, or playlists..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 bg-card-bg border-card-border text-white placeholder:text-text-secondary"
                  />
                </div>
              </div>
              {searchTerm && (
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger className="w-40 bg-card-bg border-card-border text-white">
                    <SelectValue placeholder="Search in..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card-bg border-card-border">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="songs">Songs</SelectItem>
                    <SelectItem value="artists">Artists</SelectItem>
                    <SelectItem value="playlists">Playlists</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-card-bg">
                <TabsTrigger value="trending" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="recommended" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Heart className="w-4 h-4 mr-2" />
                  For You
                </TabsTrigger>
                {searchTerm && (
                  <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Search className="w-4 h-4 mr-2" />
                    Search Results
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="trending" className="space-y-6">
                <SongList
                  title="Trending Now"
                  endpoint="/api/songs/trending"
                  queryKey={["/api/songs/trending"]}
                />
              </TabsContent>

              <TabsContent value="recommended" className="space-y-6">
                <SongList
                  title="Recommended for You"
                  endpoint="/api/songs/recommendations"
                  queryKey={["/api/songs/recommendations"]}
                />
              </TabsContent>

              {searchTerm && (
                <TabsContent value="search" className="space-y-6">
                  {renderSearchResults()}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}