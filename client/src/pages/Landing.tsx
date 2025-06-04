import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Menu, X } from "lucide-react";

export default function Landing() {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showListenerPlans, setShowListenerPlans] = useState(true);

  const selectAccountType = (type: string) => {
    // Store account type preference in localStorage for the setup flow
    localStorage.setItem('selectedAccountType', type);
    setShowAccountModal(false);
    
    // Route directly to registration form
    window.location.href = "/signup";
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <i className="fas fa-brain text-ai-purple text-2xl"></i>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-green-500 bg-clip-text text-transparent">
              AIM
            </span>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-text-secondary hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-text-secondary hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-text-secondary hover:text-white transition-colors">
              About
            </a>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/auth"}
              className="border-ai-purple text-ai-purple hover:bg-ai-purple hover:text-white"
            >
              Sign In
            </Button>
          </div>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-dark-bg border-t border-gray-800 z-50">
            <div className="px-6 py-4 space-y-4">
              <a 
                href="#features" 
                className="block text-text-secondary hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="block text-text-secondary hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="#about" 
                className="block text-text-secondary hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = "/auth";
                  }}
                  className="w-full border-ai-purple text-ai-purple hover:bg-ai-purple hover:text-white"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(rgba(18, 18, 18, 0.8), rgba(18, 18, 18, 0.8)), url('https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="text-center max-w-4xl mx-auto px-6">
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            THE FUTURE OF{" "}
            <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 bg-clip-text text-transparent">
              MUSIC
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Upload unlimited AI-generated music, earn from streams, and connect with fans. The complete platform for AI music creators and listeners.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setShowAccountModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-ai-purple to-ai-blue text-white font-semibold rounded-full hover:shadow-lg transition-all transform hover:scale-105"
            >
              Join the Revolution
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 border-white text-white hover:bg-white hover:text-dark-bg transition-all rounded-full"
            >
              Explore AI Music
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Revolutionizing Music Creation & Distribution
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card-bg border-gray-800">
              <CardContent className="p-8">
                <i className="fas fa-robot text-ai-purple text-3xl mb-4"></i>
                <h3 className="text-xl font-semibold mb-4">AI-Powered Creation</h3>
                <p className="text-text-secondary">
                  Upload and distribute music created with cutting-edge AI technology. From fully AI-generated to AI-assisted compositions.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card-bg border-gray-800">
              <CardContent className="p-8">
                <i className="fas fa-coins text-spotify-green text-3xl mb-4"></i>
                <h3 className="text-xl font-semibold mb-4">Smart Monetization</h3>
                <p className="text-text-secondary">
                  Multiple revenue streams including streaming royalties, direct tipping, and ad revenue sharing for maximum earning potential.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card-bg border-gray-800">
              <CardContent className="p-8">
                <i className="fas fa-chart-line text-ai-blue text-3xl mb-4"></i>
                <h3 className="text-xl font-semibold mb-4">Advanced Analytics</h3>
                <p className="text-text-secondary">
                  Comprehensive insights into your music performance, audience demographics, and revenue optimization.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-card-bg">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-text-secondary text-center mb-16 max-w-3xl mx-auto">
            From music listeners to professional management companies, we have the perfect plan for everyone
          </p>

          {/* Plan Type Selector */}
          <div className="flex justify-center mb-12">
            <div className="flex bg-dark-bg rounded-full p-1">
              <Button
                variant={showListenerPlans ? "default" : "ghost"}
                onClick={() => setShowListenerPlans(true)}
                className="rounded-full px-6 py-2"
              >
                Listener Plans
              </Button>
              <Button
                variant={!showListenerPlans ? "default" : "ghost"}
                onClick={() => setShowListenerPlans(false)}
                className="rounded-full px-6 py-2"
              >
                Creator Plans
              </Button>
            </div>
          </div>
          
          {showListenerPlans ? (
            // Listener Plans
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Free Listener */}
              <Card className="bg-dark-bg border-gray-800 hover:border-ai-purple transition-all transform hover:scale-105">
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">Free</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                    <p className="text-text-secondary mb-6">Basic listening experience</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Limited streaming with ads</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Basic playlist creation</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">AI music discovery</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-times text-red-500 mr-3"></i>
                      <span className="text-sm text-text-secondary">No offline listening</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-times text-red-500 mr-3"></i>
                      <span className="text-sm text-text-secondary">No high-quality audio</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-ai-purple hover:bg-ai-purple/90"
                    onClick={() => window.location.href = "/signup?plan=listener-free"}
                  >
                    Get Started Free
                  </Button>
                </CardContent>
              </Card>

              {/* Premium Listener */}
              <Card className="bg-dark-bg border-2 border-ai-purple transform scale-105 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-ai-purple to-ai-blue text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">Premium</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">$3.99</span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                    <p className="text-text-secondary mb-6">Ad-free premium experience</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Unlimited ad-free streaming</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">High-quality audio</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Offline downloads</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Direct artist tipping</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Unlimited playlists</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-gradient-to-r from-ai-purple to-ai-blue hover:shadow-lg"
                    onClick={() => window.location.href = "/signup?plan=listener-premium"}
                  >
                    Go Premium
                  </Button>
                </CardContent>
              </Card>

              {/* VIP Listener */}
              <Card className="bg-dark-bg border-gray-800 hover:border-spotify-green transition-all transform hover:scale-105">
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">VIP</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">$7.99</span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                    <p className="text-text-secondary mb-6">Ultimate listening experience</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Everything in Premium</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Lossless audio quality</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Early access to new releases</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Exclusive artist content</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Priority customer support</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-spotify-green hover:bg-spotify-green/90"
                    onClick={() => window.location.href = "/signup?plan=listener-vip"}
                  >
                    Join VIP
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Creator Plans
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Artist Plan */}
              <Card className="bg-dark-bg border-gray-800 hover:border-ai-purple transition-all transform hover:scale-105">
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">Artist</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">$4.99</span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                    <p className="text-text-secondary mb-6">Perfect for solo creators</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Unlimited song uploads</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">1 artist profile</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">$0.001 per stream</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Royalty splits</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Mobile app access</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-ai-purple hover:bg-ai-purple/90"
                    onClick={() => window.location.href = "/signup?plan=artist"}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Artist Plus Plan */}
              <Card className="bg-dark-bg border-2 border-ai-purple transform scale-105 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-ai-purple to-ai-blue text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">Artist Plus</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">$9.99</span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                    <p className="text-text-secondary mb-6">For serious artists</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Up to 5 artist profiles</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">$0.002 per stream</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Synced lyrics editor</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Daily analytics</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Release scheduling</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-gradient-to-r from-ai-purple to-ai-blue hover:shadow-lg"
                    onClick={() => window.location.href = "/signup?plan=artist-plus"}
                  >
                    Choose Plus
                  </Button>
                </CardContent>
              </Card>

              {/* Manager Plan */}
              <Card className="bg-dark-bg border-gray-800 hover:border-spotify-green transition-all transform hover:scale-105">
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">Manager</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">$12.99</span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                    <p className="text-text-secondary mb-6">Professional management</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">1-100 artist profiles</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">$0.003 per stream</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Advanced dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">Recommendation boost</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-spotify-green mr-3"></i>
                      <span className="text-sm">API access</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-spotify-green hover:bg-spotify-green/90"
                    onClick={() => window.location.href = "/signup?plan=manager"}
                  >
                    Start Managing
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.href = "/pricing"}
              className="border-ai-purple text-ai-purple hover:bg-ai-purple hover:text-white"
            >
              Compare All Features
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Built for the AI Music Revolution
              </h2>
              <p className="text-xl text-text-secondary mb-6">
                AIM is the first comprehensive platform designed specifically for AI-generated music. Whether you're creating with Suno, Udio, or any other AI music tool, we provide the infrastructure to distribute, monetize, and grow your audience.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <i className="fas fa-upload text-ai-purple mr-4"></i>
                  <span>Upload unlimited AI-generated tracks with synchronized lyrics</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-dollar-sign text-spotify-green mr-4"></i>
                  <span>Earn revenue through streams, tips, and royalty splits</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-chart-bar text-ai-blue mr-4"></i>
                  <span>Track performance with detailed analytics and insights</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-users text-ai-purple mr-4"></i>
                  <span>Connect with fans and build your AI music community</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card-bg p-6 rounded-lg">
                <h4 className="text-2xl font-bold text-ai-purple mb-2">50K+</h4>
                <p className="text-text-secondary">AI Tracks Uploaded</p>
              </div>
              <div className="bg-card-bg p-6 rounded-lg">
                <h4 className="text-2xl font-bold text-spotify-green mb-2">1M+</h4>
                <p className="text-text-secondary">Streams Generated</p>
              </div>
              <div className="bg-card-bg p-6 rounded-lg">
                <h4 className="text-2xl font-bold text-ai-blue mb-2">5K+</h4>
                <p className="text-text-secondary">Active Artists</p>
              </div>
              <div className="bg-card-bg p-6 rounded-lg">
                <h4 className="text-2xl font-bold text-ai-purple mb-2">$100K+</h4>
                <p className="text-text-secondary">Artist Earnings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Account Type Selection Modal */}
      <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
        <DialogContent className="bg-card-bg max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">Choose Your Account Type</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {/* Listener Account */}
            <Card 
              className="bg-dark-bg border-gray-800 hover:border-ai-purple transition-colors cursor-pointer"
              onClick={() => selectAccountType('listener')}
            >
              <CardContent className="p-6">
                <i className="fas fa-headphones text-ai-purple text-3xl mb-4"></i>
                <h3 className="text-xl font-semibold mb-3">Listener</h3>
                <p className="text-text-secondary mb-4">
                  Discover and stream AI-generated music. Support your favorite AI artists through tips and streams.
                </p>
                <ul className="text-sm text-text-secondary space-y-2">
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Unlimited streaming</li>
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Tipping system</li>
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Playlist creation</li>
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Ad-free experience</li>
                </ul>
              </CardContent>
            </Card>

            {/* Artist Account */}
            <Card 
              className="bg-dark-bg border-gray-800 hover:border-ai-blue transition-colors cursor-pointer"
              onClick={() => selectAccountType('artist')}
            >
              <CardContent className="p-6">
                <i className="fas fa-microphone text-ai-blue text-3xl mb-4"></i>
                <h3 className="text-xl font-semibold mb-3">Artist</h3>
                <p className="text-text-secondary mb-4">
                  Upload, distribute, and monetize your AI-generated music. Track your performance and earnings.
                </p>
                <ul className="text-sm text-text-secondary space-y-2">
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Music upload & distribution</li>
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Revenue tracking</li>
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Analytics dashboard</li>
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Direct fan tipping</li>
                </ul>
              </CardContent>
            </Card>

            {/* Manager Account */}
            <Card 
              className="bg-dark-bg border-gray-800 hover:border-spotify-green transition-colors cursor-pointer"
              onClick={() => selectAccountType('manager')}
            >
              <CardContent className="p-6">
                <i className="fas fa-users text-spotify-green text-3xl mb-4"></i>
                <h3 className="text-xl font-semibold mb-3">Manager</h3>
                <p className="text-text-secondary mb-4">
                  Manage multiple AI artists, track consolidated revenue, and oversee distribution strategies.
                </p>
                <ul className="text-sm text-text-secondary space-y-2">
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Multi-artist management</li>
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Consolidated analytics</li>
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Revenue distribution</li>
                  <li><i className="fas fa-check text-spotify-green mr-2"></i>Advanced reporting</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}