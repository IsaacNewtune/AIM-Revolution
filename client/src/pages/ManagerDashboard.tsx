import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Upload, Plus } from "lucide-react";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: managedArtists = [] } = useQuery({
    queryKey: ['/api/manager/artists'],
  });

  // Calculate aggregate stats
  const stats = {
    totalArtists: managedArtists.length,
    totalRevenue: managedArtists.reduce((sum: number, artist: any) => sum + parseFloat(artist.totalRevenue || '0'), 0),
    totalStreams: managedArtists.reduce((sum: number, artist: any) => sum + (artist.totalStreams || 0), 0),
    activeReleases: managedArtists.reduce((sum: number, artist: any) => sum + (artist.activeReleases || 0), 0),
  };

  const topArtists = managedArtists
    .sort((a: any, b: any) => (b.totalStreams || 0) - (a.totalStreams || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header userType="manager" />
      <div className="flex">
        <Sidebar userType="manager" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold">Management Dashboard</h1>
            <Button 
              onClick={() => setLocation('/manager/create-artist')}
              className="px-4 py-2 bg-gradient-to-r from-ai-purple to-ai-blue text-white rounded-lg hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <i className="fas fa-plus mr-2"></i>Add New Artist
            </Button>
          </div>

        {/* Quick Actions */}
        <section className="mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Button
              onClick={() => setLocation('/manager/create-artist')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-6 h-auto flex flex-col items-center space-y-2"
            >
              <Plus className="h-6 w-6" />
              <span className="text-lg font-medium">Add New Artist</span>
              <span className="text-sm opacity-90">Onboard a new artist</span>
            </Button>
            <Button
              onClick={() => setLocation('/upload')}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 p-6 h-auto flex flex-col items-center space-y-2"
            >
              <Upload className="h-6 w-6" />
              <span className="text-lg font-medium">Upload Content</span>
              <span className="text-sm opacity-90">Upload for your artists</span>
            </Button>
            <Button
              onClick={() => setLocation('/analytics')}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 p-6 h-auto flex flex-col items-center space-y-2"
            >
              <i className="fas fa-chart-bar text-xl"></i>
              <span className="text-lg font-medium">View Analytics</span>
              <span className="text-sm opacity-90">Track performance</span>
            </Button>
          </div>
        </section>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="bg-card-bg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Managed Artists</p>
                  <p className="text-2xl font-bold text-ai-purple">{stats.totalArtists}</p>
                </div>
                <i className="fas fa-users text-ai-purple text-2xl"></i>
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
                  <p className="text-text-secondary text-sm">Active Releases</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.activeReleases}</p>
                </div>
                <i className="fas fa-music text-yellow-500 text-2xl"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Artists */}
        <section className="mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-4">Top Performing Artists</h2>
          <Card className="bg-card-bg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="grid grid-cols-12 gap-4 text-sm text-text-secondary font-medium">
                <div className="col-span-4">ARTIST</div>
                <div className="col-span-2">STREAMS</div>
                <div className="col-span-2">REVENUE</div>
                <div className="col-span-2">GROWTH</div>
                <div className="col-span-2">ACTIONS</div>
              </div>
            </div>
            {topArtists.map((artist: any) => (
              <div key={artist.id} className="p-4 border-b border-gray-700 hover:bg-gray-800 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 flex items-center space-x-4">
                    <img 
                      src={artist.profileImageUrl || "/api/placeholder/100/100"} 
                      alt={artist.name} 
                      className="w-12 h-12 rounded-full object-cover" 
                    />
                    <div>
                      <h3 className="font-medium">{artist.name}</h3>
                      <p className="text-text-secondary text-sm">{artist.genre || 'AI Music'}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">{(artist.totalStreams || 0).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-spotify-green">${parseFloat(artist.totalRevenue || '0').toFixed(2)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-spotify-green text-sm">+15.3%</span>
                  </div>
                  <div className="col-span-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-ai-purple hover:text-purple-400 mr-2"
                      onClick={() => window.location.href = `/artist-analytics/${artist.id}`}
                    >
                      <i className="fas fa-chart-line"></i>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-ai-blue hover:text-blue-400 mr-2"
                      onClick={() => setLocation(`/upload?artistId=${artist.id}`)}
                      title="Upload Song"
                    >
                      <i className="fas fa-upload"></i>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-text-secondary hover:text-white"
                      onClick={() => window.location.href = `/edit-artist/${artist.id}`}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {managedArtists.length === 0 && (
              <div className="p-8 text-center text-text-secondary">
                No artists managed yet. Add your first artist to get started!
              </div>
            )}
          </Card>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl lg:text-2xl font-bold mb-4">Recent Activity</h2>
          <Card className="bg-card-bg">
            <CardContent className="p-6">
              <div className="space-y-4">
                {managedArtists.slice(0, 5).map((artist: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="w-2 h-2 bg-spotify-green rounded-full"></div>
                    <div className="flex-1">
                      <p>{artist.name} statistics updated</p>
                      <p className="text-text-secondary text-sm">2 hours ago</p>
                    </div>
                    <i className="fas fa-chart-line text-text-secondary"></i>
                  </div>
                ))}
                {managedArtists.length === 0 && (
                  <div className="text-center text-text-secondary py-8">
                    No recent activity to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
        </div>
      </div>
    </div>
  );
}
