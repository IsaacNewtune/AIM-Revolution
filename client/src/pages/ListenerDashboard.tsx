import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import MusicPlayer from "@/components/MusicPlayer";
import TipModal from "@/components/TipModal";
import { useAuth } from "@/hooks/useAuth";
import { Search } from "lucide-react";

export default function ListenerDashboard() {
  const { user } = useAuth();
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipTarget, setTipTarget] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['/api/songs', { search: searchQuery }],
  });

  const { data: streamHistory = [] } = useQuery({
    queryKey: ['/api/streams/history'],
  });

  const handleTip = (type: 'track' | 'artist', data: any) => {
    setTipTarget({ type, data });
    setShowTipModal(true);
  };

  const handlePlay = (song: any) => {
    setCurrentSong(song);
    // Record stream
    fetch('/api/streams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ songId: song.id }),
    });
  };

  const recentlyPlayed = streamHistory.slice(0, 6);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-ai-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Sidebar userType="listener" />
      
      {/* Main Content */}
      <div className="ml-64 p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Good evening, {user?.firstName || 'Music Lover'}
          </h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <i className="fas fa-bell"></i>
            </Button>
            <img 
              src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
              alt="User Profile" 
              className="w-10 h-10 rounded-full object-cover" 
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for songs, artists, or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card-bg border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recently Played</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyPlayed.map((item: any, index: number) => (
                <Card 
                  key={index}
                  className="bg-card-bg hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => handlePlay(item)}
                >
                  <CardContent className="p-4">
                    <img 
                      src={item.coverArtUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"} 
                      alt="Album Cover" 
                      className="w-full aspect-square object-cover rounded-lg mb-3" 
                    />
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <p className="text-text-secondary text-sm truncate">{item.artist || 'AI Artist'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Search Results or Trending AI Music */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {searchQuery ? `Search Results for "${searchQuery}"` : "Trending AI Music"}
            </h2>
            {!searchQuery && <a href="#" className="text-text-secondary hover:text-white text-sm">Show all</a>}
          </div>
          {songs.length === 0 && searchQuery ? (
            <div className="text-center py-8 text-text-secondary">
              <p>No songs found for "{searchQuery}"</p>
              <p className="text-sm mt-2">Try searching for different keywords or browse trending music</p>
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p>No songs available yet</p>
              <p className="text-sm mt-2">Check back later for new AI-generated music</p>
            </div>
          ) : (
            <div className="space-y-2">
              {songs.slice(0, 10).map((song: any, index: number) => (
                <div 
                  key={song.id}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-card-bg transition-colors cursor-pointer group"
                >
                <span className="text-text-secondary w-4">{index + 1}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handlePlay(song)}
                >
                  <i className="fas fa-play text-white"></i>
                </Button>
                <img 
                  src={song.coverArtUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                  alt="Track Cover" 
                  className="w-12 h-12 rounded object-cover" 
                />
                <div className="flex-1">
                  <h3 className="font-medium">{song.title}</h3>
                  <p className="text-text-secondary text-sm">AI Artist</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleTip('track', song)}
                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-xs rounded-full"
                  >
                    <i className="fas fa-coins mr-1"></i>Tip
                  </Button>
                  <span className="text-text-secondary text-sm">
                    {Math.floor((song.duration || 200) / 60)}:{String((song.duration || 200) % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Music Player Bar */}
      {currentSong && <MusicPlayer song={currentSong} onTip={handleTip} />}

      {/* Tip Modal */}
      <TipModal
        open={showTipModal}
        onOpenChange={setShowTipModal}
        target={tipTarget}
      />
    </div>
  );
}
