import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Menu, X, Home, Search, Upload, Users, Settings, BarChart3, Music, Heart, Coins, Plus } from "lucide-react";

interface HeaderProps {
  userType?: 'listener' | 'artist' | 'manager';
}

export default function Header({ userType }: HeaderProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getNavigationItems = () => {
    if (!userType) return [];
    
    switch (userType) {
      case 'listener':
        return [
          { icon: Home, label: 'Home', href: '/' },
          { icon: Search, label: 'Discover', href: '/discover' },
          { icon: Music, label: 'My Playlists', href: '/playlists' },
          { icon: Heart, label: 'Liked Songs', href: '/liked' },
          { icon: Coins, label: 'Tip History', href: '/tips' },
          { icon: Settings, label: 'Settings', href: '/settings' },
        ];
      case 'artist':
        return [
          { icon: BarChart3, label: 'Dashboard', href: '/artist' },
          { icon: Upload, label: 'Upload Music', href: '/upload' },
          { icon: Music, label: 'My Releases', href: '/releases' },
          { icon: BarChart3, label: 'Analytics', href: '/analytics' },
          { icon: Settings, label: 'Settings', href: '/settings' },
        ];
      case 'manager':
        return [
          { icon: BarChart3, label: 'Dashboard', href: '/manager' },
          { icon: Users, label: 'My Artists', href: '/manager' },
          { icon: BarChart3, label: 'Analytics', href: '/analytics' },
          { icon: Plus, label: 'Add Artist', href: '/manager/create-artist' },
          { icon: Settings, label: 'Settings', href: '/settings' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const getDashboardPath = () => {
    switch (userType) {
      case 'artist': return '/artist';
      case 'manager': return '/manager';
      default: return '/';
    }
  };

  return (
    <header className="bg-black border-b border-gray-800 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href={getDashboardPath()}>
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AIM</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-lg">AIM</h1>
              <p className="text-gray-400 text-xs">THE FUTURE OF MUSIC</p>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-gray-800 flex items-center space-x-2"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* User Info & Mobile Menu */}
        <div className="flex items-center space-x-4">
          {/* User Info */}
          {user && (
            <div className="hidden sm:flex items-center space-x-3">
              {user.profileImageUrl && (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div className="text-right">
                <p className="text-white text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-gray-400 text-xs capitalize">{userType}</p>
              </div>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-gray-800"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-black border-gray-800">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">AIM</span>
                    </div>
                    <div>
                      <h1 className="text-white font-bold text-lg">AIM</h1>
                      <p className="text-gray-400 text-xs">THE FUTURE OF MUSIC</p>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                {user && (
                  <div className="py-6 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                      {user.profileImageUrl && (
                        <img
                          src={user.profileImageUrl}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="text-white text-base font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-gray-400 text-sm capitalize">{userType}</p>
                        {user.creditBalance && (
                          <p className="text-green-400 text-sm">
                            Credits: ${user.creditBalance}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 py-6">
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 h-12"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </nav>

                {/* Logout */}
                <div className="pt-6 border-t border-gray-800">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-gray-800"
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.location.href = '/api/logout';
                    }}
                  >
                    <X className="w-5 h-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}