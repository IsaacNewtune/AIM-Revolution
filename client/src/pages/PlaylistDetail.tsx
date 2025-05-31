import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Play, Pause, Plus, Search, MoreVertical, Share2, Globe, Lock, Music, X, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MusicPlayer from "@/components/MusicPlayer";

export default function PlaylistDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/playlist/:id");
  const playlistId = params?.id;
  
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  // Fetch playlist details
  const { data: playlist, isLoading: playlistLoading } = useQuery({
    queryKey: ['/api/playlists', playlistId],
    enabled: !!playlistId
  });

  // Fetch playlist songs
  const { data: playlistSongs, isLoading: songsLoading } = useQuery({
    queryKey: ['/api/playlists', playlistId, 'songs'],
    enabled: !!playlistId
  });

  // Fetch available songs for adding to playlist
  const { data: availableSongs } = useQuery({
    queryKey: ['/api/songs', { search: searchTerm }],
    enabled: showAddSongModal
  });

  // Add songs to playlist mutation
  const addSongsMutation = useMutation({
    mutationFn: async (songIds: string[]) => {
      const response = await apiRequest('POST', `/api/playlists/${playlistId}/songs`, { songIds });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedSongs.length} song(s) added to playlist!`,
      });
      setShowAddSongModal(false);
      setSelectedSongs([]);
      setSearchTerm("");
      queryClient.invalidateQueries({ queryKey: ['/api/playlists', playlistId, 'songs'] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add songs. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove song from playlist mutation
  const removeSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      await apiRequest('DELETE', `/api/playlists/${playlistId}/songs/${songId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Song removed from playlist!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/playlists', playlistId, 'songs'] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove song. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddSongs = () => {
    if (selectedSongs.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one song to add.",
        variant: "destructive",
      });
      return;
    }
    addSongsMutation.mutate(selectedSongs);
  };

  const handleRemoveSong = (songId: string) => {
    removeSongMutation.mutate(songId);
  };

  const sharePlaylist = async () => {
    const shareUrl = `${window.location.origin}/playlist/${playlistId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Success",
        description: "Playlist link copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Share Link",
        description: shareUrl,
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (playlistLoading || songsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Playlist not found</h2>
          <p className="text-gray-600">The playlist you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === playlist.userId;
  const totalDuration = playlistSongs?.reduce((acc: number, song: any) => acc + (song.duration || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Playlist Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Playlist Cover */}
            <div className="w-full md:w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {playlist.coverImageUrl ? (
                <img 
                  src={playlist.coverImageUrl} 
                  alt={playlist.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Music className="w-20 h-20 text-purple-400" />
              )}
            </div>

            {/* Playlist Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {playlist.isPublic ? (
                  <Badge variant="outline">
                    <Globe className="w-3 h-3 mr-1" />
                    Public Playlist
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Lock className="w-3 h-3 mr-1" />
                    Private Playlist
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{playlist.title}</h1>
              
              {playlist.description && (
                <p className="text-gray-600 mb-4">{playlist.description}</p>
              )}
              
              <div className="flex items-center text-sm text-gray-500 space-x-4 mb-6">
                <span>{playlistSongs?.length || 0} songs</span>
                <span>{formatDuration(totalDuration)}</span>
                <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <Button 
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!playlistSongs || playlistSongs.length === 0}
                  onClick={() => setCurrentSong(playlistSongs?.[0])}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Play All
                </Button>
                
                {isOwner && (
                  <Dialog open={showAddSongModal} onOpenChange={setShowAddSongModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Songs
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
                
                <Button variant="outline" onClick={sharePlaylist}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Songs List */}
        <Card>
          <CardHeader>
            <CardTitle>Songs</CardTitle>
          </CardHeader>
          <CardContent>
            {playlistSongs && playlistSongs.length > 0 ? (
              <div className="space-y-2">
                {playlistSongs.map((song: any, index: number) => (
                  <div 
                    key={song.id} 
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 group"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                      
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-purple-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{song.title}</h4>
                        <p className="text-sm text-gray-500 truncate">{song.artistName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDuration(song.duration || 0)}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentSong(song)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      
                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveSong(song.id)}
                              className="text-red-600"
                            >
                              Remove from playlist
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No songs in this playlist</h3>
                <p className="text-gray-500 mb-4">Start building your playlist by adding some songs</p>
                {isOwner && (
                  <Button onClick={() => setShowAddSongModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Songs
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Songs Modal */}
        <Dialog open={showAddSongModal} onOpenChange={setShowAddSongModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Add Songs to Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search for songs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={handleAddSongs}
                  disabled={selectedSongs.length === 0 || addSongsMutation.isPending}
                >
                  Add {selectedSongs.length > 0 && `(${selectedSongs.length})`}
                </Button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {availableSongs && availableSongs.length > 0 ? (
                  <div className="space-y-2">
                    {availableSongs.map((song: any) => (
                      <div 
                        key={song.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSongs.includes(song.id) 
                            ? 'bg-purple-50 border-purple-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedSongs(prev => 
                            prev.includes(song.id)
                              ? prev.filter(id => id !== song.id)
                              : [...prev, song.id]
                          );
                        }}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded flex items-center justify-center">
                          <Music className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{song.title}</h4>
                          <p className="text-sm text-gray-500">{song.artistName}</p>
                        </div>
                        {selectedSongs.includes(song.id) && (
                          <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No songs found. Try a different search term.</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Music Player */}
        {currentSong && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
            <MusicPlayer 
              song={currentSong} 
              onTip={() => {}} 
            />
          </div>
        )}
      </div>
    </div>
  );
}