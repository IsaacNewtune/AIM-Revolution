import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import LyricsEditor from "@/components/LyricsEditor";
import { Music, Plus, Search, FileText, Clock } from "lucide-react";

interface Song {
  id: string;
  title: string;
  artistName: string;
  fileUrl: string;
  duration: number | null;
  hasLyrics?: boolean;
}

interface LyricLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

export default function LyricsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's songs
  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['/api/songs', 'my-songs'],
    enabled: !!user && (user.accountType === 'artist' || user.accountType === 'manager')
  });

  // Save lyrics mutation
  const saveLyricsMutation = useMutation({
    mutationFn: async ({ songId, lyrics }: { songId: string; lyrics: LyricLine[] }) => {
      const content = lyrics.map(line => ({
        text: line.text,
        startTime: line.startTime,
        endTime: line.endTime
      }));

      await apiRequest('POST', `/api/songs/${songId}/lyrics`, { content });
    },
    onSuccess: () => {
      toast({ title: "Lyrics saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      setShowEditor(false);
      setSelectedSong(null);
    },
    onError: () => {
      toast({ 
        title: "Failed to save lyrics", 
        variant: "destructive" 
      });
    }
  });

  // Filter songs based on search term
  const filteredSongs = songs.filter((song: Song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditLyrics = (song: Song) => {
    setSelectedSong(song);
    setShowEditor(true);
  };

  const handleSaveLyrics = (lyrics: LyricLine[]) => {
    if (!selectedSong) return;
    saveLyricsMutation.mutate({ songId: selectedSong.id, lyrics });
  };

  if (!user || (user.accountType !== 'artist' && user.accountType !== 'manager')) {
    return (
      <div className="min-h-screen bg-dark-bg text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Only artists and managers can manage lyrics.</p>
        </div>
      </div>
    );
  }

  if (showEditor && selectedSong) {
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
                setShowEditor(false);
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

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Lyrics Manager</h1>
            <p className="text-gray-400">
              Add synchronized lyrics to your songs for an enhanced listening experience
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-ai-purple/20 text-ai-purple">
              {filteredSongs.length} Songs
            </Badge>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-card-bg border-gray-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search your songs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-bg border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Songs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card-bg border-gray-700">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-600 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSongs.length === 0 ? (
          <Card className="bg-card-bg border-gray-700">
            <CardContent className="p-12 text-center">
              <Music className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? 'No songs found' : 'No songs uploaded yet'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Upload your first song to start adding synchronized lyrics'
                }
              </p>
              {!searchTerm && (
                <Button className="bg-ai-purple hover:bg-ai-purple/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Song
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSongs.map((song: Song) => (
              <Card key={song.id} className="bg-card-bg border-gray-700 hover:border-ai-purple/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate text-white">
                        {song.title}
                      </CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        by {song.artistName}
                      </p>
                    </div>
                    {song.hasLyrics && (
                      <Badge variant="secondary" className="bg-green-900/50 text-green-400 ml-2">
                        <FileText className="h-3 w-3 mr-1" />
                        Lyrics
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Clock className="h-3 w-3" />
                    <span>
                      {song.duration 
                        ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}`
                        : 'Unknown duration'
                      }
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditLyrics(song)}
                      className="flex-1 bg-ai-purple hover:bg-ai-purple/90"
                      size="sm"
                    >
                      {song.hasLyrics ? 'Edit Lyrics' : 'Add Lyrics'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}