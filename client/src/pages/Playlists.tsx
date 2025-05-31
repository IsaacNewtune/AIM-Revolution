import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Music, Globe, Lock, MoreVertical, Play, Share2, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Playlists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [newPlaylist, setNewPlaylist] = useState({
    title: '',
    description: '',
    isPublic: false
  });

  // Fetch user's playlists
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['/api/playlists'],
    enabled: !!user
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (playlistData: typeof newPlaylist) => {
      const response = await apiRequest('POST', '/api/playlists', playlistData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Playlist created successfully!",
      });
      setShowCreateModal(false);
      setNewPlaylist({ title: '', description: '', isPublic: false });
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
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
        description: "Failed to create playlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update playlist mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest('PUT', `/api/playlists/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Playlist updated successfully!",
      });
      setEditingPlaylist(null);
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
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
        description: "Failed to update playlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      await apiRequest('DELETE', `/api/playlists/${playlistId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Playlist deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
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
        description: "Failed to delete playlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePlaylist = () => {
    if (!newPlaylist.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist title.",
        variant: "destructive",
      });
      return;
    }
    createPlaylistMutation.mutate(newPlaylist);
  };

  const handleUpdatePlaylist = () => {
    if (!editingPlaylist.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist title.",
        variant: "destructive",
      });
      return;
    }
    updatePlaylistMutation.mutate(editingPlaylist);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      deletePlaylistMutation.mutate(playlistId);
    }
  };

  const sharePlaylist = async (playlist: any) => {
    const shareUrl = `${window.location.origin}/playlist/${playlist.id}`;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Playlists</h1>
            <p className="text-gray-600 mt-2">Create and manage your music collections</p>
          </div>

          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Playlist Title</Label>
                  <Input
                    id="title"
                    placeholder="My Awesome Playlist"
                    value={newPlaylist.title}
                    onChange={(e) => setNewPlaylist(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your playlist..."
                    value={newPlaylist.description}
                    onChange={(e) => setNewPlaylist(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="public"
                    checked={newPlaylist.isPublic}
                    onCheckedChange={(checked) => setNewPlaylist(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <Label htmlFor="public">Make playlist public</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePlaylist}
                    disabled={createPlaylistMutation.isPending}
                  >
                    {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Playlists Grid */}
        {playlists && playlists.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {playlists.map((playlist: any) => (
              <Card key={playlist.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {playlist.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        {playlist.isPublic ? (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {playlist.songCount || 0} songs
                        </span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingPlaylist(playlist)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => sharePlaylist(playlist)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePlaylist(playlist.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-4">
                    {playlist.coverImageUrl ? (
                      <img 
                        src={playlist.coverImageUrl} 
                        alt={playlist.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Music className="w-12 h-12 text-purple-400" />
                    )}
                  </div>
                  
                  {playlist.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {playlist.description}
                    </p>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.location.href = `/playlist/${playlist.id}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No playlists yet</h3>
            <p className="text-gray-500 mb-6">Create your first playlist to start organizing your favorite songs</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Playlist
            </Button>
          </div>
        )}

        {/* Edit Playlist Modal */}
        <Dialog open={!!editingPlaylist} onOpenChange={() => setEditingPlaylist(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Playlist</DialogTitle>
            </DialogHeader>
            {editingPlaylist && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Playlist Title</Label>
                  <Input
                    id="edit-title"
                    value={editingPlaylist.title}
                    onChange={(e) => setEditingPlaylist(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingPlaylist.description || ''}
                    onChange={(e) => setEditingPlaylist(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-public"
                    checked={editingPlaylist.isPublic}
                    onCheckedChange={(checked) => setEditingPlaylist(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <Label htmlFor="edit-public">Make playlist public</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingPlaylist(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdatePlaylist}
                    disabled={updatePlaylistMutation.isPending}
                  >
                    {updatePlaylistMutation.isPending ? "Updating..." : "Update Playlist"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}