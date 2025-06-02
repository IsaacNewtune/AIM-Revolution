import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";

export default function ArtistDashboard() {
  const { user } = useAuth();

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



  const stats = {
    totalStreams: songs.reduce((sum: number, song: any) => sum + (song.streamCount || 0), 0),
    totalRevenue: songs.reduce((sum: number, song: any) => sum + parseFloat(song.revenue || '0'), 0),
    totalTips: tips.reduce((sum: number, tip: any) => sum + parseFloat(tip.amount || '0'), 0),
    monthlyListeners: artist?.monthlyListeners || 0,
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header userType="artist" />
      <div className="flex">
        <Sidebar userType="artist" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64 p-4 lg:p-6 pt-20 lg:pt-6">
          {/* Artist Profile Header */}
        <div 
          className="relative mb-6 lg:mb-8 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="p-4 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              <img 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"} 
                alt="Artist Profile" 
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-white" 
              />
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl lg:text-4xl font-bold mb-2">
                  {artist?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'AI Artist'}
                </h1>
                <p className="text-text-secondary mb-2">{artist?.location || 'Location not set'}</p>
                <p className="text-sm">Followers: {artist?.followers || 0}</p>
              </div>
              <div className="w-full sm:w-auto sm:ml-6">
                <Button 
                  onClick={() => window.location.href = '/upload'}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 lg:px-6 py-2 lg:py-3 text-base lg:text-lg w-full sm:w-auto"
                >
                  Upload Music
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
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

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Button
              onClick={() => window.location.href = '/upload'}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-6 h-auto flex flex-col items-center space-y-2"
            >
              <i className="fas fa-upload text-2xl"></i>
              <span className="text-lg font-medium">Upload New Track</span>
              <span className="text-sm opacity-90">Upload your AI-generated music</span>
            </Button>
            <Button
              onClick={() => window.location.href = '/analytics'}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 p-6 h-auto flex flex-col items-center space-y-2"
            >
              <i className="fas fa-chart-bar text-2xl"></i>
              <span className="text-lg font-medium">View Analytics</span>
              <span className="text-sm opacity-90">Track your performance</span>
            </Button>
            <Button
              onClick={() => window.location.href = '/playlists'}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 p-6 h-auto flex flex-col items-center space-y-2"
            >
              <i className="fas fa-list text-2xl"></i>
              <span className="text-lg font-medium">Manage Playlists</span>
              <span className="text-sm opacity-90">Organize your music</span>
            </Button>
          </div>
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
    </div>
  );
}
