import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import LyricsEditor from "@/components/LyricsEditor";
import { 
  ArrowLeft, 
  Music, 
  Play, 
  Edit, 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock,
  FileText,
  Plus
} from "lucide-react";

interface Song {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  coverArtUrl: string | null;
  duration: number | null;
  genre: string | null;
  mood: string | null;
  tags: string[];
  streamCount: number;
  revenue: string;
  isPublished: boolean;
  createdAt: string;
  hasLyrics?: boolean;
}

interface Artist {
  id: number;
  userId: string;
  name: string;
  bio: string | null;
  profileImageUrl: string | null;
  totalStreams: number;
  totalRevenue: string;
  totalTips: string;
  monthlyListeners: number;
}

export default function ArtistManagementDashboard() {
  const { artistId } = useParams();
  const [, setLocation] = useLocation();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showLyricsEditor, setShowLyricsEditor] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch artist data
  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: [`/api/artists/${artistId}`],
    enabled: !!artistId
  });

  // Fetch artist's songs
  const { data: songs = [], isLoading: songsLoading } = useQuery({
    queryKey: [`/api/artists/${artistId}/songs`],
    enabled: !!artistId
  });

  // Fetch artist analytics
  const { data: analytics } = useQuery({
    queryKey: [`/api/artists/${artistId}/analytics`],
    enabled: !!artistId
  });

  const handleEditLyrics = (song: Song) => {
    setSelectedSong(song);
    setShowLyricsEditor(true);
  };

  const handleSaveLyrics = async (lyrics: any[]) => {
    if (!selectedSong) return;
    
    try {
      await apiRequest('POST', `/api/songs/${selectedSong.id}/lyrics`, { content: lyrics });
      toast({ title: "Lyrics saved successfully!" });
      queryClient.invalidateQueries({ queryKey: [`/api/artists/${artistId}/songs`] });
      setShowLyricsEditor(false);
      setSelectedSong(null);
    } catch (error) {
      toast({ title: "Failed to save lyrics", variant: "destructive" });
    }
  };

  if (!user || user.accountType !== 'manager') {
    return (
      <div className="min-h-screen bg-dark-bg text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Only managers can access artist management dashboards.</p>
        </div>
      </div>
    );
  }

  if (showLyricsEditor && selectedSong) {
    return (
      <div className="min-h-screen bg-dark-bg text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Lyrics Editor</h1>
              <p className="text-gray-400">
                Adding synchronized lyrics for "{selectedSong.title}"
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowLyricsEditor(false);
                setSelectedSong(null);
              }}
            >
              Back to Songs
            </Button>
          </div>

          <LyricsEditor
            songId={selectedSong.id}
            audioUrl={`/uploads/${selectedSong.fileUrl}`}
            onSave={handleSaveLyrics}
          />
        </div>
      </div>
    );
  }

  if (artistLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white">
        <Header userType="manager" />
        <div className="pt-20 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-600 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header userType="manager" />
      
      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation('/manager')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manager Dashboard
            </Button>
          </div>

          {/* Artist Info */}
          <div className="flex items-center gap-6 mb-8">
            <img
              src={artist?.profileImageUrl || `/api/placeholder/200/200`}
              alt={artist?.name}
              className="w-32 h-32 rounded-full object-cover"
            />
            <div>
              <h1 className="text-4xl font-bold mb-2">{artist?.name}</h1>
              <p className="text-gray-400 mb-4">{artist?.bio || "AI Music Artist"}</p>
              <div className="flex gap-4">
                <Badge variant="secondary" className="bg-ai-purple/20 text-ai-purple">
                  {songs.length} Songs
                </Badge>
                <Badge variant="secondary" className="bg-green-900/50 text-green-400">
                  {artist?.monthlyListeners?.toLocaleString()} Monthly Listeners
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card-bg border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Streams</p>
                    <p className="text-2xl font-bold text-ai-purple">
                      {artist?.totalStreams?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Play className="h-8 w-8 text-ai-purple" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card-bg border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${parseFloat(artist?.totalRevenue || '0').toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card-bg border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Tips</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      ${parseFloat(artist?.totalTips || '0').toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card-bg border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Monthly Listeners</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {artist?.monthlyListeners?.toLocaleString() || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="songs" className="space-y-6">
            <TabsList className="bg-card-bg">
              <TabsTrigger value="songs">Songs</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="songs">
              <Card className="bg-card-bg border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Songs ({songs.length})</CardTitle>
                    <Button
                      onClick={() => setLocation(`/upload?artistId=${artistId}`)}
                      className="bg-ai-purple hover:bg-ai-purple/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Song
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {songsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : songs.length === 0 ? (
                    <div className="text-center py-12">
                      <Music className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No songs uploaded yet</h3>
                      <p className="text-gray-400 mb-6">Upload the first song for this artist</p>
                      <Button
                        onClick={() => setLocation(`/upload?artistId=${artistId}`)}
                        className="bg-ai-purple hover:bg-ai-purple/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Song
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {songs.map((song: Song) => (
                        <div
                          key={song.id}
                          className="flex items-center gap-4 p-4 border border-gray-700 rounded-lg hover:border-ai-purple/50 transition-colors"
                        >
                          <img
                            src={song.coverArtUrl ? `/uploads/${song.coverArtUrl}` : `/api/placeholder/64/64`}
                            alt={song.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">{song.title}</h3>
                            <p className="text-sm text-gray-400 truncate">
                              {song.description || "No description"}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {song.streamCount?.toLocaleString() || 0} streams
                              </span>
                              <span className="text-xs text-green-400">
                                ${parseFloat(song.revenue || '0').toFixed(2)}
                              </span>
                              {song.hasLyrics && (
                                <Badge variant="secondary" className="bg-green-900/50 text-green-400">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Lyrics
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLyrics(song)}
                              className="text-ai-purple hover:text-ai-purple/80"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {song.hasLyrics ? 'Edit Lyrics' : 'Add Lyrics'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/edit-song/${song.id}`)}
                              className="text-gray-400 hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="bg-card-bg border-gray-700">
                <CardHeader>
                  <CardTitle>Analytics Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Detailed Analytics</h3>
                    <p className="text-gray-400">Advanced analytics coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue">
              <Card className="bg-card-bg border-gray-700">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border border-gray-700 rounded-lg">
                      <span>Streaming Revenue</span>
                      <span className="text-green-400 font-medium">
                        ${parseFloat(artist?.totalRevenue || '0').toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 border border-gray-700 rounded-lg">
                      <span>Tips Revenue</span>
                      <span className="text-yellow-400 font-medium">
                        ${parseFloat(artist?.totalTips || '0').toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 border border-gray-700 rounded-lg bg-ai-purple/10">
                      <span className="font-medium">Total Revenue</span>
                      <span className="text-ai-purple font-bold text-lg">
                        ${(parseFloat(artist?.totalRevenue || '0') + parseFloat(artist?.totalTips || '0')).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}