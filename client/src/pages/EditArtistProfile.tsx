import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Upload, User, Globe } from 'lucide-react';

export default function EditArtistProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get artist ID from URL
  const artistId = window.location.pathname.split('/').pop();
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    genre: '',
    website: '',
    facebookHandle: '',
    twitterHandle: '',
    instagramHandle: '',
    tiktokHandle: '',
    youtubeUrl: ''
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [bannerImagePreview, setBannerImagePreview] = useState<string>('');

  // Fetch artist data
  const { data: artist, isLoading } = useQuery({
    queryKey: ['/api/artists', artistId],
    enabled: !!artistId,
  });

  // Populate form when artist data loads
  useEffect(() => {
    if (artist) {
      setFormData({
        name: artist.name || '',
        bio: artist.bio || '',
        location: artist.location || '',
        genre: artist.genre || '',
        website: artist.website || '',
        facebookHandle: artist.facebookHandle || '',
        twitterHandle: artist.twitterHandle || '',
        instagramHandle: artist.instagramHandle || '',
        tiktokHandle: artist.tiktokHandle || '',
        youtubeUrl: artist.youtubeUrl || ''
      });
      
      if (artist.profileImageUrl) {
        setProfileImagePreview(artist.profileImageUrl);
      }
      if (artist.bannerImageUrl) {
        setBannerImagePreview(artist.bannerImageUrl);
      }
    }
  }, [artist]);

  const updateArtistMutation = useMutation({
    mutationFn: async (artistData: FormData) => {
      return await apiRequest("PATCH", `/api/artists/${artistId}`, artistData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Artist profile updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/artists'] });
      setLocation('/manager-dashboard');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update artist profile. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating artist:', error);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (type: 'profile' | 'banner', file: File) => {
    if (type === 'profile') {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    } else {
      setBannerImage(file);
      setBannerImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Artist name is required.",
        variant: "destructive",
      });
      return;
    }

    const submitData = new FormData();
    
    // Add text fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        submitData.append(key, value);
      }
    });
    
    // Add images if selected
    if (profileImage) {
      submitData.append('profileImage', profileImage);
    }
    if (bannerImage) {
      submitData.append('bannerImage', bannerImage);
    }
    
    updateArtistMutation.mutate(submitData);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation('/manager-dashboard')}
            className="text-text-secondary hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Artist Profile</h1>
            <p className="text-text-secondary">Update {artist?.name}'s information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Banner Image */}
          <Card className="bg-card-bg border-gray-700 overflow-hidden">
            <div className="relative h-48 bg-gradient-to-r from-purple-900 to-blue-900">
              {bannerImagePreview && (
                <img 
                  src={bannerImagePreview} 
                  alt="Banner" 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <label className="cursor-pointer bg-black bg-opacity-50 p-4 rounded-lg hover:bg-opacity-70 transition-all">
                  <Upload className="w-6 h-6 text-white mx-auto mb-2" />
                  <span className="text-white text-sm">Update Banner</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload('banner', e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Image & Basic Info */}
            <div className="lg:col-span-1">
              <Card className="bg-card-bg border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <img
                        src={profileImagePreview || '/api/placeholder/200/200'}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover border-4 border-gray-600"
                      />
                      <label className="absolute bottom-0 right-0 bg-ai-purple p-2 rounded-full cursor-pointer hover:bg-purple-600 transition-colors">
                        <Upload className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload('profile', e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-card-bg border-gray-700">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Artist Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="bg-gray-800 border-gray-600"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="genre">Genre</Label>
                      <Input
                        id="genre"
                        value={formData.genre}
                        onChange={(e) => handleInputChange('genre', e.target.value)}
                        placeholder="e.g., Electronic, Hip-Hop"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, Country"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://artist-website.com"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Artist Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about the artist..."
                      rows={4}
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="bg-card-bg border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Social Media & Online Presence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="instagram">Instagram Handle</Label>
                      <Input
                        id="instagram"
                        value={formData.instagramHandle}
                        onChange={(e) => handleInputChange('instagramHandle', e.target.value)}
                        placeholder="@username"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter">Twitter Handle</Label>
                      <Input
                        id="twitter"
                        value={formData.twitterHandle}
                        onChange={(e) => handleInputChange('twitterHandle', e.target.value)}
                        placeholder="@username"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebook">Facebook Page</Label>
                      <Input
                        id="facebook"
                        value={formData.facebookHandle}
                        onChange={(e) => handleInputChange('facebookHandle', e.target.value)}
                        placeholder="facebook.com/artistname"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tiktok">TikTok Handle</Label>
                      <Input
                        id="tiktok"
                        value={formData.tiktokHandle}
                        onChange={(e) => handleInputChange('tiktokHandle', e.target.value)}
                        placeholder="@username"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="youtube">YouTube Channel URL</Label>
                      <Input
                        id="youtube"
                        value={formData.youtubeUrl}
                        onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                        placeholder="https://youtube.com/c/artistname"
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setLocation('/manager-dashboard')}
                  className="border-gray-600 text-text-secondary hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateArtistMutation.isPending}
                  className="bg-ai-purple hover:bg-purple-600 text-white"
                >
                  {updateArtistMutation.isPending ? 'Updating...' : 'Update Artist Profile'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}