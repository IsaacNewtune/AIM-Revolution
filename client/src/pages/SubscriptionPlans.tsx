import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function SubscriptionPlans() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<string>('listener');

  useEffect(() => {
    // Get account type from user data or URL params
    if (user?.accountType) {
      setAccountType(user.accountType);
    }
  }, [user]);

  const getPlansForAccountType = (type: string) => {
    switch (type) {
      case 'listener':
        return [
          {
            id: 'free',
            name: 'Free Listener',
            price: '$0',
            period: '/month',
            description: 'Discover AI music with basic features',
            features: [
              'Stream music with ads (limited skips)',
              'Basic playlist creation (up to 10 playlists)',
              'Community features and reviews',
              'Standard audio quality (128kbps)',
              'Follow artists and leave comments',
              'Limited offline downloads (5 songs)',
              'Basic AI music discovery'
            ],
            buttonText: 'Start Free',
            popular: false
          },
          {
            id: 'premium',
            name: 'Premium Listener',
            price: '$4.99',
            period: '/month',
            description: 'Ultimate AI music experience without limits',
            features: [
              'Unlimited ad-free streaming',
              'High-quality audio (320kbps + lossless)',
              'Unlimited offline downloads',
              'Unlimited playlist creation',
              'Early access to new AI releases',
              'Support artists with paid streams',
              'Advanced AI music recommendations',
              'Exclusive behind-the-scenes content',
              'Priority customer support',
              'Social sharing features',
              'Concert and event notifications',
              'Lyrics display with timing'
            ],
            buttonText: 'Go Premium',
            popular: true
          }
        ];
      case 'artist':
        return [
          {
            id: 'artist',
            name: 'Artist',
            price: '$4.99',
            period: '/month',
            description: 'Perfect for solo artists and small creators',
            features: [
              '∞ Upload unlimited songs and lyrics',
              'Create royalty splits with other artists',
              'Mobile app access',
              '1 artist or band profile',
              'Receive tips from any subscriber',
              'Receive $0.001 per stream (paid subscribers)',
              'Basic streaming analytics',
              'Community engagement tools',
              'Artist profile customization',
              'Direct fan messaging',
              'Social media integration'
            ],
            buttonText: 'Start Creating',
            popular: false
          },
          {
            id: 'artist-plus',
            name: 'Artist Plus',
            price: '$9.99',
            period: '/month',
            description: 'Enhanced features for serious artists',
            features: [
              'Up to 5 artists or bands',
              '∞ Upload unlimited songs and lyrics',
              'Create royalty splits with other artists',
              'Mobile app access',
              'Synced lyrics with timing editor',
              'Daily streaming stats & analytics',
              'Customize release and preorder dates',
              'Customizable song and album pricing',
              'Receive tips from any subscriber',
              'Receive $0.002 per stream (paid subscribers)',
              'Advanced fan demographics',
              'Playlist submission tools',
              'Music video uploads',
              'Merchandise integration',
              'Priority customer support'
            ],
            buttonText: 'Go Plus',
            popular: true
          }
        ];
      case 'manager':
        return [
          {
            id: 'manager',
            name: 'Manager',
            price: '$12.99',
            period: '/month',
            description: 'Professional artist management at scale',
            features: [
              'Manage 1-100 artists or bands',
              '∞ Upload unlimited songs and lyrics',
              'Create royalty splits with other artists',
              'Mobile app access',
              'Synced lyrics with timing editor',
              'Daily streaming stats & analytics',
              'Customize release and preorder dates',
              'Customizable song and album pricing',
              'Receive tips from any subscriber',
              'Receive $0.003 per stream (paid subscribers)',
              'Monitor music and revenue in advanced dashboard',
              'Option to add artists to top of recommendations',
              'Bulk upload and management tools',
              'White-label artist profiles',
              'Revenue split automation (customizable %)',
              'Advanced analytics across all artists',
              'Artist performance comparisons',
              'Promotional campaign tools',
              'Direct label and distributor connections',
              'Priority playlist placements',
              'Dedicated account manager',
              'API access for integrations'
            ],
            buttonText: 'Manage Artists',
            popular: true
          }
        ];
      default:
        return [];
    }
  };

  const plans = getPlansForAccountType(accountType);

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
    localStorage.setItem('selectedPlan', planId);
    localStorage.setItem('selectedAccountType', accountType);
    
    if (planId === 'free') {
      // Free plan - complete setup and go to dashboard
      setLocation('/');
    } else {
      // Paid plans - go to payment processing
      setLocation('/payment-setup');
    }
  };

  const getPageTitle = () => {
    switch (accountType) {
      case 'listener':
        return 'Choose Your Listening Plan';
      case 'artist':
        return 'Artist Subscription';
      case 'manager':
        return 'Manager Subscription';
      default:
        return 'Choose Your Plan';
    }
  };

  const getPageDescription = () => {
    switch (accountType) {
      case 'listener':
        return 'Select the perfect plan to enjoy AI-generated music';
      case 'artist':
        return 'Start monetizing your AI-generated music today';
      case 'manager':
        return 'Manage multiple artists and grow their careers';
      default:
        return 'Select the perfect plan for your needs';
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{getPageTitle()}</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            {getPageDescription()}
          </p>
        </div>

        <div className={`grid gap-8 ${
          plans.length === 1 ? 'max-w-md mx-auto' : 
          plans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 
          'md:grid-cols-3'
        }`}>
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative bg-card-bg border-2 transition-all hover:scale-105 ${
                plan.popular 
                  ? 'border-ai-purple shadow-lg shadow-ai-purple/20' 
                  : 'border-gray-700 hover:border-ai-blue'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-ai-purple to-ai-blue text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-text-secondary">{plan.period}</span>
                </div>
                <p className="text-text-secondary">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check text-spotify-green mr-3 mt-1 flex-shrink-0"></i>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanSelection(plan.id as any)}
                  className={`w-full py-3 font-semibold rounded-lg transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-ai-purple to-ai-blue text-white hover:shadow-lg'
                      : plan.id === 'free'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-ai-blue text-white hover:bg-blue-600'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-text-secondary mb-4">
            All plans include access to our growing library of AI-generated music
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex items-center">
              <i className="fas fa-shield-alt text-spotify-green mr-2"></i>
              Secure payments
            </div>
            <div className="flex items-center">
              <i className="fas fa-sync-alt text-spotify-green mr-2"></i>
              Cancel anytime
            </div>
            <div className="flex items-center">
              <i className="fas fa-headphones text-spotify-green mr-2"></i>
              24/7 support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}