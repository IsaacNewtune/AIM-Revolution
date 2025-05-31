import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  userType: 'listener' | 'artist' | 'manager';
}

export default function Sidebar({ userType }: SidebarProps) {
  const { user } = useAuth();

  const creditBalance = user?.creditBalance || '0';

  const getNavigationItems = () => {
    switch (userType) {
      case 'listener':
        return [
          { icon: 'fas fa-home', label: 'Home', href: '/' },
          { icon: 'fas fa-search', label: 'Discover', href: '/discover' },
          { icon: 'fas fa-list', label: 'My Playlists', href: '/playlists' },
          { icon: 'fas fa-heart', label: 'Liked Songs', href: '/liked' },
          { icon: 'fas fa-coins', label: 'Tip History', href: '/tips' },
        ];
      case 'artist':
        return [
          { icon: 'fas fa-chart-line', label: 'Dashboard', href: '/artist' },
          { icon: 'fas fa-upload', label: 'Upload Music', href: '/upload' },
          { icon: 'fas fa-music', label: 'My Releases', href: '/releases' },
          { icon: 'fas fa-dollar-sign', label: 'Revenue', href: '/analytics' },
          { icon: 'fas fa-cog', label: 'Settings', href: '/settings' },
        ];
      case 'manager':
        return [
          { icon: 'fas fa-chart-line', label: 'Overview', href: '/manager' },
          { icon: 'fas fa-users', label: 'My Artists', href: '/manager' },
          { icon: 'fas fa-dollar-sign', label: 'Revenue', href: '/revenue' },
          { icon: 'fas fa-plus', label: 'Add Artist', href: '/manager/create-artist' },
          { icon: 'fas fa-cog', label: 'Settings', href: '/settings' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="fixed left-0 top-0 w-64 h-full bg-black p-6">
      <div className="flex items-center space-x-2 mb-8">
        <i className="fas fa-brain text-ai-purple text-xl"></i>
        <span className="text-xl font-bold">AiBeats</span>
      </div>
      
      <nav className="space-y-4">
        {navigationItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="flex items-center space-x-3 transition-colors text-text-secondary hover:text-white"
          >
            <i className={`${item.icon} w-5`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      {/* Credit Balance for Listeners */}
      {userType === 'listener' && (
        <Card className="mt-8 bg-card-bg">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Tip Credits</h3>
            <p className="text-2xl font-bold text-spotify-green">${parseFloat(creditBalance).toFixed(2)}</p>
            <Button className="w-full mt-2 px-4 py-2 bg-ai-purple hover:bg-purple-600 rounded-lg transition-colors">
              Buy Credits
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Logout Button */}
      <div className="absolute bottom-6 left-6 right-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = '/api/logout'}
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </Button>
      </div>
    </div>
  );
}
