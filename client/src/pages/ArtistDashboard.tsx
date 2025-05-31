import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function ArtistDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    aiGenerationMethod: 'fully_ai',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const { data: artist } = useQuery({
    queryKey: ['/api/artist/profile'],
  });

  const { data: songs = [] } = useQuery({
    queryKey: ['/api/songs/artist', artist?.id],
    enabled: !!artist?.id,
  });

  const { data: tips = [] } = useQuery({
    queryKey: ['/api/tips/received', artist?.id],
    enabled: !!artist?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/songs/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Track uploaded successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/songs/artist'] });
      setUploadData({ title: '', description: '', aiGenerationMethod: 'fully_ai' });
      setAudioFile(null);
      setArtworkFile(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Upload Failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleUpload = () => {
    if (!audioFile || !uploadData.title) {
      toast({ 
        title: "Missing Information", 
        description: "Please provide a title and audio file",
        variant: "destructive" 
      });
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioFile);
    if (artworkFile) formData.append('artwork', artworkFile);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('aiGenerationMethod', uploadData.aiGenerationMethod);

    uploadMutation.mutate(formData);
  };

  const stats = {
    totalStreams: songs.reduce((sum: number, song: any) => sum + (song.streamCount || 0), 0),
    totalRevenue: songs.reduce((sum: number, song: any) => sum + parseFloat(song.revenue || '0'), 0),
    totalTips: tips.reduce((sum: number, tip: any) => sum + parseFloat(tip.amount || '0'), 0),
    monthlyListeners: artist?.monthlyListeners || 0,
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Sidebar userType="artist" />
      
      {/* Main Content */}
      <div className="ml-64 p-6">
        {/* Artist Profile Header */}
        <div 
          className="relative mb-8 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="p-8">
            <div className="flex items-end space-x-6">
              <img 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"} 
                alt="Artist Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white" 
              />
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">
                  {artist?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'AI Artist'}
                </h1>
                <p className="text-text-secondary mb-2">{artist?.location || 'Location not set'}</p>
                <p className="text-sm">Followers: {artist?.followers || 0}</p>
              </div>
              <div className="ml-6">
                <Button 
                  onClick={() => window.location.href = '/upload'}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 text-lg"
                >
                  Upload Music
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card-bg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Streams</p>
                  <p className="text-2xl font-bold text-ai-blue">{stats.totalStreams.toLocaleString()}</p>
                </div>
                <i className="fas fa-play text-ai-blue text-2xl"></i>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-bg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-spotify-green">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <i className="fas fa-dollar-sign text-spotify-green text-2xl"></i>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-bg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Tips Received</p>
                  <p className="text-2xl font-bold text-yellow-500">${stats.totalTips.toFixed(2)}</p>
                </div>
                <i className="fas fa-coins text-yellow-500 text-2xl"></i>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card-bg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Monthly Listeners</p>
                  <p className="text-2xl font-bold text-ai-purple">{stats.monthlyListeners.toLocaleString()}</p>
                </div>
                <i className="fas fa-users text-ai-purple text-2xl"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upload New Track</h2>
          <Card className="bg-card-bg">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="block text-sm font-medium mb-2">Track File</Label>
                  <div 
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-ai-purple transition-colors cursor-pointer"
                    onClick={() => document.getElementById('audio-upload')?.click()}
                  >
                    <i className="fas fa-upload text-3xl text-text-secondary mb-4"></i>
                    <p className="text-text-secondary">
                      {audioFile ? audioFile.name : 'Drop your AI-generated track here or click to browse'}
                    </p>
                    <p className="text-xs text-text-secondary mt-2">MP3, WAV, FLAC up to 50MB</p>
                    <input
                      id="audio-upload"
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">Album Artwork</Label>
                  <div 
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-ai-purple transition-colors cursor-pointer"
                    onClick={() => document.getElementById('artwork-upload')?.click()}
                  >
                    <i className="fas fa-image text-3xl text-text-secondary mb-4"></i>
                    <p className="text-text-secondary">
                      {artworkFile ? artworkFile.name : 'Upload cover art'}
                    </p>
                    <p className="text-xs text-text-secondary mt-2">JPG, PNG minimum 1400x1400px</p>
                    <input
                      id="artwork-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <Label htmlFor="title">Track Title</Label>
                  <Input
                    id="title"
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter track title"
                    className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                  />
                </div>
                <div>
                  <Label htmlFor="ai-method">AI Generation Method</Label>
                  <Select 
                    value={uploadData.aiGenerationMethod} 
                    onValueChange={(value) => setUploadData(prev => ({ ...prev, aiGenerationMethod: value }))}
                  >
                    <SelectTrigger className="bg-dark-bg border-gray-600 focus:border-ai-purple">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fully_ai">Fully AI Generated</SelectItem>
                      <SelectItem value="ai_assisted">AI-Assisted Composition</SelectItem>
                      <SelectItem value="ai_post_processing">AI Post-Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your AI-generated track..."
                  className="bg-dark-bg border-gray-600 focus:border-ai-purple h-24 resize-none"
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-ai-purple to-ai-blue text-white rounded-lg hover:shadow-lg transition-all"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Track'}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Recent Releases */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Recent Releases</h2>
          <Card className="bg-card-bg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="grid grid-cols-12 gap-4 text-sm text-text-secondary font-medium">
                <div className="col-span-6">TRACK</div>
                <div className="col-span-2">STREAMS</div>
                <div className="col-span-2">REVENUE</div>
                <div className="col-span-2">ACTIONS</div>
              </div>
            </div>
            {songs.map((song: any) => (
              <div key={song.id} className="p-4 border-b border-gray-700 hover:bg-gray-800 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6 flex items-center space-x-4">
                    <img 
                      src={song.coverArtUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                      alt="Track Cover" 
                      className="w-12 h-12 rounded object-cover" 
                    />
                    <div>
                      <h3 className="font-medium">{song.title}</h3>
                      <p className="text-text-secondary text-sm">
                        Released {new Date(song.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">{(song.streamCount || 0).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-spotify-green">${parseFloat(song.revenue || '0').toFixed(2)}</span>
                  </div>
                  <div className="col-span-2">
                    <Button variant="ghost" size="icon">
                      <i className="fas fa-ellipsis-h"></i>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {songs.length === 0 && (
              <div className="p-8 text-center text-text-secondary">
                No releases yet. Upload your first track above!
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
