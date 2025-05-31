import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Sparkles } from "lucide-react";
import SongList from "@/components/SongList";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function Discover() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [genre, setGenre] = useState("all");
  const { user } = useAuth();

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (sortBy !== 'recent') params.append('sortBy', sortBy);
    if (genre !== 'all') params.append('genre', genre);
    params.append('limit', '50');
    return params.toString();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userType={user?.accountType || "listener"} />
      
      <div className="flex-1 overflow-auto">
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
                endpoint={`/api/songs?${buildQueryParams()}`}
                queryKey={["/api/songs", searchTerm, sortBy, genre]}
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
  );
}