import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function SubscriptionPlans() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'pro'>('free');

  const plans = [
    {
      id: 'free',
      name: 'Free Tier',
      price: '$0',
      period: '/month',
      description: 'Get started with AI music',
      features: [
        'Limited streaming with ads',
        'Basic playlist creation',
        'Community features',
        'Standard audio quality',
        'No offline listening'
      ],
      buttonText: 'Start Free',
      popular: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$9.99',
      period: '/month',
      description: 'Enhanced listening experience',
      features: [
        'Unlimited ad-free streaming',
        'High-quality audio (320kbps)',
        'Offline downloads',
        'Advanced playlist features',
        'Artist tipping system',
        'Priority customer support'
      ],
      buttonText: 'Choose Premium',
      popular: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99',
      period: '/month',
      description: 'Ultimate AI music experience',
      features: [
        'Everything in Premium',
        'Lossless audio quality',
        'Exclusive early access to new AI tracks',
        'Enhanced tipping credits ($5/month)',
        'Advanced analytics on listening habits',
        'Direct artist communication',
        'VIP community access'
      ],
      buttonText: 'Go Pro',
      popular: false,
    },
  ];

  const handlePlanSelection = (planId: 'free' | 'premium' | 'pro') => {
    setSelectedPlan(planId);
    localStorage.setItem('selectedPlan', planId);
    
    if (planId === 'free') {
      // Free plan - go directly to complete setup
      window.location.href = "/api/login";
    } else {
      // Paid plans - go to payment processing
      setLocation('/payment-setup');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Select the perfect plan to enjoy AI-generated music and support your favorite artists
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
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