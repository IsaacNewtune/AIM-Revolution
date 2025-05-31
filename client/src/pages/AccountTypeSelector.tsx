import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Music, Briefcase } from "lucide-react";

export default function AccountTypeSelector() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>(() => {
    // Check if user pre-selected an account type from the landing page
    return localStorage.getItem('selectedAccountType') || '';
  });

  const updateAccountTypeMutation = useMutation({
    mutationFn: async (accountType: string) => {
      await apiRequest('PUT', '/api/auth/user/account-type', { accountType });
    },
    onSuccess: async (_, accountType) => {
      // Clear the stored account type preference
      localStorage.removeItem('selectedAccountType');
      
      // Invalidate and refetch user data to ensure fresh authentication state
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      await queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
      
      toast({ title: "Account type updated successfully!" });
      
      // Small delay to ensure authentication state is updated
      setTimeout(() => {
        // Route based on account type
        if (accountType === 'listener') {
          // Listeners go to profile setup to complete their account
          setLocation('/profile-setup');
        } else {
          // For artist and manager accounts, redirect to subscription plans
          setLocation('/subscription-plans');
        }
      }, 100);
    },
    onError: () => {
      toast({ 
        title: "Failed to update account type", 
        variant: "destructive" 
      });
    }
  });

  const handleAccountTypeSelection = async () => {
    if (!selectedType) {
      toast({ 
        title: "Please select an account type", 
        variant: "destructive" 
      });
      return;
    }
    
    await updateAccountTypeMutation.mutateAsync(selectedType);
  };

  const accountTypes = [
    {
      type: "listener",
      title: "Music Listener",
      description: "Discover and stream AI-generated music",
      icon: Users,
      features: [
        "Stream unlimited music",
        "Create custom playlists",
        "Follow your favorite artists",
        "Leave reviews and comments"
      ]
    },
    {
      type: "artist",
      title: "Music Artist",
      description: "Upload and monetize your AI-generated music",
      icon: Music,
      features: [
        "Upload and distribute music",
        "Earn revenue from streams",
        "Analytics and insights",
        "Fan engagement tools"
      ]
    },
    {
      type: "manager",
      title: "Artist Manager",
      description: "Manage multiple artists and their careers",
      icon: Briefcase,
      features: [
        "Manage multiple artists",
        "Revenue sharing tools",
        "Analytics across artists",
        "Professional dashboard"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Account Type</h1>
          <p className="text-muted-foreground">
            Select the type of account that best describes how you'll use the platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {accountTypes.map((account) => {
            const Icon = account.icon;
            const isSelected = selectedType === account.type;
            
            return (
              <Card 
                key={account.type}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedType(account.type)}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <CardTitle className="flex items-center justify-center gap-2">
                    {account.title}
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{account.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {account.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            onClick={handleAccountTypeSelection}
            disabled={!selectedType || updateAccountTypeMutation.isPending}
            className="min-w-[200px]"
          >
            {updateAccountTypeMutation.isPending 
              ? "Setting up..." 
              : `Continue as ${selectedType ? accountTypes.find(a => a.type === selectedType)?.title : 'User'}`
            }
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            You can change your account type later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}