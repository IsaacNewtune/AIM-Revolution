import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

export default function ProfileSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const profilePicRef = useRef<HTMLInputElement>(null);
  const headerImageRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    firstName: (user as any)?.firstName || '',
    lastName: (user as any)?.lastName || '',
    bio: '',
    location: '',
    profileImage: null as File | null,
    headerImage: null as File | null,
  });

  const [creditAmount, setCreditAmount] = useState('');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/tips/sent'],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/user/update-profile", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Update Failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const addCreditsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/credits/purchase", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Credits added successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setCreditAmount('');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Payment Failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleProfileUpdate = () => {
    const formData = new FormData();
    formData.append('firstName', profileData.firstName);
    formData.append('lastName', profileData.lastName);
    formData.append('bio', profileData.bio);
    formData.append('location', profileData.location);
    
    if (profileData.profileImage) {
      formData.append('profileImage', profileData.profileImage);
    }
    if (profileData.headerImage) {
      formData.append('headerImage', profileData.headerImage);
    }

    updateProfileMutation.mutate(formData);
  };

  const handleAddCredits = () => {
    if (!creditAmount || parseFloat(creditAmount) < 1) {
      toast({ 
        title: "Invalid Amount", 
        description: "Minimum credit purchase is $1.00",
        variant: "destructive" 
      });
      return;
    }

    // In a real implementation, this would process payment through Stripe
    addCreditsMutation.mutate({ amount: creditAmount });
  };

  const handleFileUpload = (type: 'profile' | 'header', file: File | null) => {
    setProfileData(prev => ({
      ...prev,
      [type === 'profile' ? 'profileImage' : 'headerImage']: file
    }));
  };

  const currentPlan = (user as any)?.subscriptionTier || 'free';
  const planDetails = {
    free: { name: 'Free', color: 'bg-gray-500' },
    premium: { name: 'Premium', color: 'bg-ai-purple' },
    pro: { name: 'Pro', color: 'bg-ai-blue' }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-text-secondary">
            Personalize your account and manage your settings
          </p>
        </div>

        {/* Profile Information */}
        <Card className="bg-card-bg">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Images */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium mb-2">Profile Picture</Label>
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-ai-purple transition-colors"
                  onClick={() => profilePicRef.current?.click()}
                >
                  {profileData.profileImage ? (
                    <div>
                      <i className="fas fa-check text-spotify-green text-2xl mb-2"></i>
                      <p className="text-sm">{profileData.profileImage.name}</p>
                    </div>
                  ) : (
                    <div>
                      <i className="fas fa-user text-3xl text-text-secondary mb-2"></i>
                      <p className="text-text-secondary">Upload profile picture</p>
                      <p className="text-xs text-text-secondary mt-1">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                  <input
                    ref={profilePicRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload('profile', e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Header Image</Label>
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-ai-purple transition-colors"
                  onClick={() => headerImageRef.current?.click()}
                >
                  {profileData.headerImage ? (
                    <div>
                      <i className="fas fa-check text-spotify-green text-2xl mb-2"></i>
                      <p className="text-sm">{profileData.headerImage.name}</p>
                    </div>
                  ) : (
                    <div>
                      <i className="fas fa-image text-3xl text-text-secondary mb-2"></i>
                      <p className="text-text-secondary">Upload header image</p>
                      <p className="text-xs text-text-secondary mt-1">JPG, PNG up to 10MB</p>
                    </div>
                  )}
                  <input
                    ref={headerImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload('header', e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
                className="bg-dark-bg border-gray-600 focus:border-ai-purple"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="bg-dark-bg border-gray-600 focus:border-ai-purple h-24 resize-none"
              />
            </div>

            <Button
              onClick={handleProfileUpdate}
              disabled={updateProfileMutation.isPending}
              className="bg-gradient-to-r from-ai-purple to-ai-blue text-white rounded-lg hover:shadow-lg transition-all"
            >
              {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription & Payment */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Subscription Status */}
          <Card className="bg-card-bg">
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span>Current Plan:</span>
                <Badge className={`${planDetails[currentPlan as keyof typeof planDetails].color} text-white`}>
                  {planDetails[currentPlan as keyof typeof planDetails].name}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-text-secondary mb-6">
                <p>• {currentPlan === 'free' ? 'Limited streaming with ads' : 'Unlimited ad-free streaming'}</p>
                <p>• {currentPlan === 'free' ? 'Basic features' : 'Premium features included'}</p>
                {currentPlan !== 'free' && <p>• Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>}
              </div>
              <Button variant="outline" className="w-full">
                {currentPlan === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
              </Button>
            </CardContent>
          </Card>

          {/* Credit Balance */}
          <Card className="bg-card-bg">
            <CardHeader>
              <CardTitle>Tip Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-spotify-green mb-2">
                  ${parseFloat((user as any)?.creditBalance || '0').toFixed(2)}
                </div>
                <p className="text-text-secondary text-sm">Available for tipping artists</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="creditAmount">Add Credits</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">$</span>
                    <Input
                      id="creditAmount"
                      type="number"
                      min="1"
                      step="1"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="bg-dark-bg border-gray-600 pl-8 focus:border-ai-purple"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddCredits}
                  disabled={addCreditsMutation.isPending || !creditAmount}
                  className="w-full bg-spotify-green hover:bg-green-600 text-white rounded-lg transition-all"
                >
                  {addCreditsMutation.isPending ? 'Processing...' : 'Add Credits'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="bg-card-bg">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {(transactions as any[]).length > 0 ? (
              <div className="space-y-4">
                {(transactions as any[]).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-coins text-black"></i>
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.songId ? 'Song Tip' : 'Artist Tip'}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {new Date(transaction.createdAt).toLocaleDateString()} • 
                          ID: {transaction.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-yellow-500">-${transaction.amount}</p>
                      <p className="text-xs text-text-secondary">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <i className="fas fa-history text-3xl mb-4"></i>
                <p>No transactions yet</p>
                <p className="text-sm">Start tipping your favorite artists!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}