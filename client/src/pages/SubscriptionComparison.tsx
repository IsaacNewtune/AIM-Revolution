import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Check, X, Star, Zap, Crown } from "lucide-react";

export default function SubscriptionComparison() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>('artist-plus');

  const plans = [
    {
      id: 'artist',
      name: 'Artist',
      price: '$4.99',
      period: '/month',
      description: 'Perfect for solo artists and small creators',
      icon: <Star className="h-6 w-6" />,
      color: 'from-blue-500 to-purple-500',
      popular: false,
      features: {
        'Upload unlimited songs': true,
        'Royalty splits': true,
        'Mobile app access': true,
        'Artist profiles': '1',
        'Tips from subscribers': true,
        'Per stream earnings': '$0.001',
        'Synced lyrics editor': false,
        'Daily analytics': false,
        'Release scheduling': false,
        'Custom pricing': false,
        'Advanced demographics': false,
        'Playlist tools': false,
        'Music videos': false,
        'Merchandise integration': false,
        'Bulk management': false,
        'Recommendation boost': false,
        'Advanced dashboard': false,
        'Revenue automation': false,
        'White-label profiles': false,
        'API access': false,
        'Dedicated manager': false
      }
    },
    {
      id: 'artist-plus',
      name: 'Artist Plus',
      price: '$9.99',
      period: '/month',
      description: 'Enhanced features for serious artists',
      icon: <Zap className="h-6 w-6" />,
      color: 'from-purple-500 to-pink-500',
      popular: true,
      features: {
        'Upload unlimited songs': true,
        'Royalty splits': true,
        'Mobile app access': true,
        'Artist profiles': '5',
        'Tips from subscribers': true,
        'Per stream earnings': '$0.002',
        'Synced lyrics editor': true,
        'Daily analytics': true,
        'Release scheduling': true,
        'Custom pricing': true,
        'Advanced demographics': true,
        'Playlist tools': true,
        'Music videos': true,
        'Merchandise integration': true,
        'Bulk management': false,
        'Recommendation boost': false,
        'Advanced dashboard': false,
        'Revenue automation': false,
        'White-label profiles': false,
        'API access': false,
        'Dedicated manager': false
      }
    },
    {
      id: 'manager',
      name: 'Manager',
      price: '$12.99',
      period: '/month',
      description: 'Professional artist management at scale',
      icon: <Crown className="h-6 w-6" />,
      color: 'from-orange-500 to-red-500',
      popular: false,
      features: {
        'Upload unlimited songs': true,
        'Royalty splits': true,
        'Mobile app access': true,
        'Artist profiles': '1-100',
        'Tips from subscribers': true,
        'Per stream earnings': '$0.003',
        'Synced lyrics editor': true,
        'Daily analytics': true,
        'Release scheduling': true,
        'Custom pricing': true,
        'Advanced demographics': true,
        'Playlist tools': true,
        'Music videos': true,
        'Merchandise integration': true,
        'Bulk management': true,
        'Recommendation boost': true,
        'Advanced dashboard': true,
        'Revenue automation': true,
        'White-label profiles': true,
        'API access': true,
        'Dedicated manager': true
      }
    }
  ];

  const featureCategories = [
    {
      name: 'Core Features',
      features: ['Upload unlimited songs', 'Royalty splits', 'Mobile app access', 'Artist profiles', 'Tips from subscribers']
    },
    {
      name: 'Monetization',
      features: ['Per stream earnings', 'Custom pricing', 'Revenue automation']
    },
    {
      name: 'Content Management',
      features: ['Synced lyrics editor', 'Release scheduling', 'Music videos', 'Bulk management']
    },
    {
      name: 'Analytics & Insights',
      features: ['Daily analytics', 'Advanced demographics', 'Advanced dashboard']
    },
    {
      name: 'Marketing & Promotion',
      features: ['Playlist tools', 'Recommendation boost', 'Merchandise integration']
    },
    {
      name: 'Professional Tools',
      features: ['White-label profiles', 'API access', 'Dedicated manager']
    }
  ];

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
    localStorage.setItem('selectedPlan', planId);
    localStorage.setItem('selectedAccountType', planId === 'manager' ? 'manager' : 'artist');
    setLocation('/payment-setup');
  };

  const renderFeatureValue = (plan: any, feature: string) => {
    const value = plan.features[feature];
    
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-gray-400 mx-auto" />
      );
    }
    
    return <span className="text-sm font-medium">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-ai-purple to-ai-blue bg-clip-text text-transparent">
            Choose Your Creator Plan
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Compare our subscription tiers and find the perfect plan to grow your AI music career
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative bg-card-bg border-2 transition-all hover:scale-105 ${
                plan.popular 
                  ? 'border-ai-purple shadow-lg shadow-ai-purple/20 transform scale-105' 
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
              
              <CardHeader className="text-center pb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center text-white`}>
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-text-secondary">{plan.period}</span>
                </div>
                <p className="text-text-secondary text-sm">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <Button
                  onClick={() => handlePlanSelection(plan.id)}
                  className={`w-full py-3 font-semibold rounded-lg transition-all mb-6 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-ai-purple to-ai-blue text-white hover:shadow-lg'
                      : `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg`
                  }`}
                >
                  {plan.popular ? 'Get Started' : 'Choose Plan'}
                </Button>

                {/* Key Features for this plan */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Key Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {plan.features['Artist profiles']} artist profile{plan.features['Artist profiles'] !== '1' ? 's' : ''}
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {plan.features['Per stream earnings']} per stream
                    </li>
                    {plan.features['Synced lyrics editor'] && (
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Synced lyrics editor
                      </li>
                    )}
                    {plan.features['Advanced dashboard'] && (
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Advanced dashboard
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Feature Comparison */}
        <div className="bg-card-bg rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Detailed Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 font-semibold">Features</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4 font-semibold">
                      <div className="flex flex-col items-center">
                        <span>{plan.name}</span>
                        <span className="text-sm text-text-secondary">{plan.price}/month</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category) => (
                  <>
                    <tr key={category.name} className="border-b border-gray-800">
                      <td colSpan={4} className="py-4 px-4 font-semibold text-ai-purple bg-gray-900/50">
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature} className="border-b border-gray-800 hover:bg-gray-900/30">
                        <td className="py-3 px-4 text-sm">{feature}</td>
                        {plans.map((plan) => (
                          <td key={plan.id} className="py-3 px-4 text-center">
                            {renderFeatureValue(plan, feature)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-text-secondary mb-6">
            All plans include unlimited music uploads, mobile app access, and community features
          </p>
          <div className="flex justify-center space-x-8 text-sm mb-8">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              No setup fees
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              24/7 support
            </div>
          </div>
          
          <Button
            onClick={() => setLocation('/auth')}
            variant="outline"
            className="border-ai-purple text-ai-purple hover:bg-ai-purple hover:text-white"
          >
            Start with Free Account
          </Button>
        </div>
      </div>
    </div>
  );
}