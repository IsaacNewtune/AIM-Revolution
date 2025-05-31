import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload, User, MapPin, Globe, Camera } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function CreateArtistProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    spotifyUrl: '',
    soundcloudUrl: '',
    youtubeUrl: ''
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [bannerImagePreview, setBannerImagePreview] = useState<string>('');

  const createArtistMutation = useMutation({
    mutationFn: async (artistData: FormData) => {
      const response = await fetch('/api/artists', {
        method: 'POST',
        body: artistData,
      });
      if (!response.ok) throw new Error('Failed to create artist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager/artists'] });
      toast({ title: "Artist profile created successfully!" });
      setLocation('/manager');
    },
    onError: () => {
      toast({ 
        title: "Failed to create artist profile", 
        variant: "destructive" 
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        title: "Artist name is required", 
        variant: "destructive" 
      });
      return;
    }

    const formDataToSend = new FormData();
    
    // Add text fields
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });
    
    // Add image files
    if (profileImage) {
      formDataToSend.append('profileImage', profileImage);
    }
    if (bannerImage) {
      formDataToSend.append('bannerImage', bannerImage);
    }
    
    await createArtistMutation.mutateAsync(formDataToSend);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Sidebar userType="manager" />
      
      <div className="ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/manager')}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Create Artist Profile</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Banner Image Upload */}
            <Card className="bg-card-bg border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Banner Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div 
                    className={`w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-ai-purple transition-colors ${bannerImagePreview ? 'border-ai-purple' : ''}`}
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                    {bannerImagePreview ? (
                      <img 
                        src={bannerImagePreview} 
                        alt="Banner preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-400">Click to upload banner image</p>
                        <p className="text-xs text-gray-500">Recommended: 1200x300px</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload('banner', e.target.files[0])}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Image and Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Image */}
              <Card className="bg-card-bg border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div 
                      className={`w-full aspect-square border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-ai-purple transition-colors ${profileImagePreview ? 'border-ai-purple' : ''}`}
                      onClick={() => document.getElementById('profile-upload')?.click()}
                    >
                      {profileImagePreview ? (
                        <img 
                          src={profileImagePreview} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-400">Upload photo</p>
                          <p className="text-xs text-gray-500">Square image recommended</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload('profile', e.target.files[0])}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <div className="lg:col-span-2 space-y-6">
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
                          placeholder="Enter artist name"
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
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="genre">Primary Genre</Label>
                        <Input
                          id="genre"
                          value={formData.genre}
                          onChange={(e) => handleInputChange('genre', e.target.value)}
                          placeholder="e.g., Electronic, Hip-Hop, Pop"
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
              </div>
            </div>

            {/* Social Media Links */}
            <Card className="bg-card-bg border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Social Media & Streaming Platforms
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
                  <div>
                    <Label htmlFor="spotify">Spotify URL</Label>
                    <Input
                      id="spotify"
                      value={formData.spotifyUrl}
                      onChange={(e) => handleInputChange('spotifyUrl', e.target.value)}
                      placeholder="https://open.spotify.com/artist/..."
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="soundcloud">SoundCloud URL</Label>
                    <Input
                      id="soundcloud"
                      value={formData.soundcloudUrl}
                      onChange={(e) => handleInputChange('soundcloudUrl', e.target.value)}
                      placeholder="https://soundcloud.com/artistname"
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

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation('/manager')}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createArtistMutation.isPending}
                className="bg-gradient-to-r from-ai-purple to-ai-blue hover:shadow-lg"
              >
                {createArtistMutation.isPending ? "Creating..." : "Create Artist Profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}