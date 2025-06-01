import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Landing() {
  const [showAccountModal, setShowAccountModal] = useState(false);

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
            <span className="text-2xl font-bold bg-gradient-to-r from-ai-purple to-ai-blue bg-clip-text text-transparent">
              AIM
            </span>
          </div>
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
        </nav>
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
            <span className="bg-gradient-to-r from-ai-purple via-ai-blue to-spotify-green bg-clip-text text-transparent">
              AI MUSIC
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Stream, distribute, and monetize AI-generated music. The revolutionary platform where artificial intelligence meets artistic expression.
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
