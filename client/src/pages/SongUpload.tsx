import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Music } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

const aiGenerators = [
  "Suno",
  "Udio", 
  "Boomy",
  "AIVA",
  "Amper Music",
  "Jukedeck",
  "Soundraw",
  "Beatoven.ai",
  "Loudly",
  "Mubert",
  "Ecrett Music",
  "WavTool",
  "Other"
];

const genres = [
  "Pop", "Rock", "Hip Hop", "R&B", "Country", "Electronic", "Jazz", "Classical",
  "Blues", "Folk", "Reggae", "Punk", "Metal", "Alternative", "Indie", "Dance",
  "House", "Techno", "Trance", "Dubstep", "Ambient", "Lofi", "Trap", "Drill",
  "Afrobeat", "Latin", "World", "Soundtrack", "Experimental", "Other"
];

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese",
  "Korean", "Chinese", "Russian", "Arabic", "Hindi", "Other", "Instrumental"
];

const trackPrices = [
  { value: "0.49", label: "$0.49" },
  { value: "0.99", label: "$0.99" },
  { value: "1.29", label: "$1.29" }
];

const songSchema = z.object({
  title: z.string().min(1, "Song title is required"),
  aiGenerator: z.string().min(1, "AI generator is required"),
  hasExplicitLyrics: z.boolean(),
  isInstrumental: z.boolean(),
  price: z.string().min(1, "Price is required")
});

const uploadSchema = z.object({
  numberOfSongs: z.number().min(1).max(25),
  albumTitle: z.string().optional(),
  artistName: z.string().min(1, "Artist name is required"),
  releaseDate: z.string().min(1, "Release date is required"),
  recordLabel: z.string().optional(),
  language: z.string().min(1, "Language is required"),
  primaryGenre: z.string().min(1, "Primary genre is required"),
  secondaryGenre: z.string().optional(),
  targetArtistId: z.string().optional(),
  songs: z.array(songSchema),
  agreedToPromoServices: z.boolean().refine(val => val === true, "You must agree not to use promo services"),
  agreedToAIGuidelines: z.boolean().refine(val => val === true, "You must agree to AI generator guidelines"),
  agreedToTerms: z.boolean().refine(val => val === true, "You must agree to terms of service")
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function SongUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [songFiles, setSongFiles] = useState<{ [key: number]: File }>({});
  
  // Get artistId from URL params if manager is uploading for an artist
  const urlParams = new URLSearchParams(window.location.search);
  const targetArtistId = urlParams.get('artistId');
  
  // If user is a manager, fetch their managed artists
  const { data: managedArtists = [] } = useQuery({
    queryKey: ['/api/manager/artists'],
    enabled: user?.accountType === 'manager'
  });

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      numberOfSongs: 1,
      artistName: "",
      releaseDate: "",
      language: "",
      primaryGenre: "",
      targetArtistId: "",
      songs: [{ title: "", aiGenerator: "", hasExplicitLyrics: false, isInstrumental: false, price: "0.99" }],
      agreedToPromoServices: false,
      agreedToAIGuidelines: false,
      agreedToTerms: false
    }
  });

  const numberOfSongs = form.watch("numberOfSongs");

  // Update songs array when numberOfSongs changes
  const updateSongsArray = (count: number) => {
    const currentSongs = form.getValues("songs");
    const newSongs = Array.from({ length: count }, (_, index) => 
      currentSongs[index] || { title: "", aiGenerator: "", hasExplicitLyrics: false, isInstrumental: false, price: "0.99" }
    );
    form.setValue("songs", newSongs);
  };

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const formData = new FormData();
      
      // Add cover art if provided
      if (coverArt) {
        formData.append('coverArt', coverArt);
      }
      
      // Add song files
      Object.entries(songFiles).forEach(([index, file]) => {
        formData.append(`songFile_${index}`, file);
      });
      
      // Add metadata with target artist ID if manager is uploading
      const uploadData = {
        ...data,
        targetArtistId: targetArtistId || data.targetArtistId || undefined
      };
      formData.append('metadata', JSON.stringify(uploadData));
      
      return apiRequest("POST", "/api/songs/upload", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Songs uploaded successfully! They will be reviewed before going live.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      form.reset();
      setCoverArt(null);
      setSongFiles({});
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload songs. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UploadFormData) => {
    console.log("Form submission triggered with data:", data);
    console.log("Form errors:", form.formState.errors);
    
    // Validate that all required song files are uploaded
    const missingSongFiles = data.songs.map((_, index) => index).filter(index => !songFiles[index]);
    if (missingSongFiles.length > 0) {
      toast({
        title: "Missing Song Files",
        description: `Please upload audio files for song(s): ${missingSongFiles.map(i => i + 1).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(data);
  };

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverArt(file);
    }
  };

  const handleSongFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSongFiles(prev => ({ ...prev, [index]: file }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Upload Your Music</h1>
          <p className="text-gray-300">Share your AI-generated tracks with the world</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numberOfSongs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Songs (1-25)</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value.toString()}
                            onValueChange={(value) => {
                              const count = parseInt(value);
                              field.onChange(count);
                              updateSongsArray(count);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Artist Selection for Managers */}
                  {user?.accountType === 'manager' && !targetArtistId && (
                    <div className="space-y-2">
                      <Label>Select Artist</Label>
                      <Select onValueChange={(value) => form.setValue('targetArtistId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an artist to upload for" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(managedArtists) && managedArtists.map((artist: any) => (
                            <SelectItem key={artist.id} value={artist.id.toString()}>
                              {artist.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="albumTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Album Title (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter album title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="artistName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter artist name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="releaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recordLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Record Label (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter record label" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              {languages.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primaryGenre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Genre</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary genre" />
                            </SelectTrigger>
                            <SelectContent>
                              {genres.map(genre => (
                                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secondaryGenre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Genre (Optional)</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select secondary genre" />
                            </SelectTrigger>
                            <SelectContent>
                              {genres.map(genre => (
                                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cover Art Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Cover Art
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="cover-art">Song/Album Cover</Label>
                  <Input
                    id="cover-art"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverArtChange}
                  />
                  <p className="text-sm text-gray-500">
                    Recommended: 3000x3000 square JPG format. We accept most image sizes.
                  </p>
                  {coverArt && (
                    <p className="text-sm text-green-600">✓ Cover art selected: {coverArt.name}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Song Details */}
            <Card>
              <CardHeader>
                <CardTitle>Song Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Array.from({ length: numberOfSongs }, (_, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg">Song {index + 1}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`songs.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Song Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter song title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`songs.${index}.aiGenerator`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AI Generator Used</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select AI generator" />
                                </SelectTrigger>
                                <SelectContent>
                                  {aiGenerators.map(generator => (
                                    <SelectItem key={generator} value={generator}>{generator}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`song-file-${index}`}>Upload Song (MP3)</Label>
                      <Input
                        id={`song-file-${index}`}
                        type="file"
                        accept="audio/mp3,audio/mpeg"
                        onChange={(e) => handleSongFileChange(index, e)}
                      />
                      {songFiles[index] && (
                        <p className="text-sm text-green-600">✓ Song file selected: {songFiles[index].name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`songs.${index}.hasExplicitLyrics`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Explicit Lyrics</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`songs.${index}.isInstrumental`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Instrumental</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`songs.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Track Price</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {trackPrices.map(price => (
                                    <SelectItem key={price.value} value={price.value}>{price.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Compliance Agreements */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance & Agreements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="agreedToPromoServices"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree not to use "promo services" that guarantee streams or playlisting
                        </FormLabel>
                        <FormDescription>
                          Even if they claim "organic and real" streams. These services typically use fake stream-bots easily detectable by streaming services.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreedToAIGuidelines"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I have followed all guidelines from the AI generator
                        </FormLabel>
                        <FormDescription>
                          Including their rights to list commercially and all terms of use for the AI music generation service.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreedToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the Terms of Service & Distribution Agreement
                        </FormLabel>
                        <FormDescription>
                          By checking this box, you agree to our terms and conditions for music distribution.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button 
                type="submit" 
                size="lg" 
                disabled={uploadMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Songs"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}