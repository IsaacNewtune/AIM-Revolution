import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Sparkles, User, Music, List } from "lucide-react";
import SongList from "@/components/SongList";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";

export default function Discover() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [genre, setGenre] = useState("all");
  const { user } = useAuth();

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search query - only execute if we have a search term
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/search', debouncedSearchTerm, searchType],
    enabled: !!debouncedSearchTerm,
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('q', debouncedSearchTerm);
      params.append('type', searchType);
      params.append('limit', '20');
      return fetch(`/api/search?${params.toString()}`).then(res => res.json());
    }
  });

  // Default content queries (when not searching)
  const { data: allSongs = [] } = useQuery({
    queryKey: ['/api/songs', sortBy, genre],
    enabled: !debouncedSearchTerm,
    queryFn: () => {
      const params = new URLSearchParams();
      if (sortBy !== 'recent') params.append('sortBy', sortBy);
      if (genre !== 'all') params.append('genre', genre);
      params.append('limit', '50');
      return fetch(`/api/songs?${params.toString()}`).then(res => res.json());
    }
  });

  const { data: trendingSongs = [] } = useQuery({
    queryKey: ['/api/songs/trending'],
    enabled: !debouncedSearchTerm
  });

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
                  placeholder="Search songs, artists, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card-bg border-gray-700 text-white"
                />
              </div>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-card-bg border-gray-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-48 bg-card-bg border-gray-700 text-white">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="ambient">Ambient</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="pop">Pop</SelectItem>
                <SelectItem value="classical">Classical</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="lofi">Lofi</SelectItem>
                <SelectItem value="experimental">Experimental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-card-bg">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                All Songs
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="recommended" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                For You
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <SongList
                title="All Songs"
                endpoint="/api/songs"
                queryKey={["/api/songs", sortBy, genre]}
              />
            </TabsContent>

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
          </Tabs>
        </div>
        </div>
      </div>
    </div>
  );
}