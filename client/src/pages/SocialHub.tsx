import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Star,
  UserPlus,
  UserMinus,
  ThumbsUp,
  Send,
  Music,
  TrendingUp
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Artist {
  id: number;
  name: string;
  profileImageUrl?: string;
  totalStreams: number;
  totalRevenue: string;
  isFollowed?: boolean;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  songId: string;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  likesCount: number;
  isLiked?: boolean;
}

interface Song {
  id: string;
  title: string;
  artistName: string;
  coverArtUrl?: string;
  streamCount: number;
}

export default function SocialHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

  // Fetch followed artists
  const { data: followedArtists = [] } = useQuery({
    queryKey: ['/api/social/followed-artists'],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiRequest('GET', '/api/social/followed-artists');
      return await response.json();
    },
    enabled: !!user
  });

  // Fetch trending artists to follow
  const { data: suggestedArtists = [] } = useQuery({
    queryKey: ['/api/artists/suggested'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/artists/suggested');
      return await response.json();
    }
  });

  // Fetch recent comments from followed artists
  const { data: feedComments = [] } = useQuery({
    queryKey: ['/api/social/feed'],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiRequest('GET', '/api/social/feed');
      return await response.json();
    },
    enabled: !!user
  });

  // Fetch song comments
  const { data: songComments = [] } = useQuery({
    queryKey: ['/api/songs', selectedSongId, 'comments'],
    queryFn: async () => {
      if (!selectedSongId) return [];
      const response = await apiRequest('GET', `/api/songs/${selectedSongId}/comments`);
      return await response.json();
    },
    enabled: !!selectedSongId
  });

  // Follow artist mutation
  const followArtistMutation = useMutation({
    mutationFn: async (artistId: number) => {
      const response = await apiRequest('POST', `/api/artists/${artistId}/follow`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/followed-artists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/artists/suggested'] });
      toast({
        title: "Artist Followed",
        description: "You'll now see their latest releases in your feed",
      });
    }
  });

  // Unfollow artist mutation
  const unfollowArtistMutation = useMutation({
    mutationFn: async (artistId: number) => {
      const response = await apiRequest('DELETE', `/api/artists/${artistId}/follow`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/followed-artists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/artists/suggested'] });
      toast({
        title: "Artist Unfollowed",
        description: "They've been removed from your feed",
      });
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ songId, content }: { songId: string; content: string }) => {
      const response = await apiRequest('POST', `/api/songs/${songId}/comments`, {
        content
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/songs', selectedSongId, 'comments'] });
      setNewComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      });
    }
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest('POST', `/api/comments/${commentId}/like`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/songs', selectedSongId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/feed'] });
    }
  });

  const handleAddComment = () => {
    if (!selectedSongId || !newComment.trim()) return;
    addCommentMutation.mutate({
      songId: selectedSongId,
      content: newComment.trim()
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Social Hub</h1>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Users className="h-4 w-4" />
          <span>Connect with Artists</span>
        </Badge>
      </div>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed">Activity Feed</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="discover">Discover Artists</TabsTrigger>
          <TabsTrigger value="comments">Song Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Latest from Artists You Follow</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedComments.length > 0 ? (
                  <div className="space-y-4">
                    {feedComments.map((comment: Comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={comment.user.profileImageUrl || ''} />
                            <AvatarFallback>
                              {getInitials(comment.user.firstName, comment.user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">
                                {comment.user.firstName} {comment.user.lastName}
                              </span>
                              <span className="text-sm text-text-secondary">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            
                            <p className="mt-2 text-sm">{comment.content}</p>
                            
                            <div className="flex items-center space-x-4 mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => likeCommentMutation.mutate(comment.id)}
                                className={`flex items-center space-x-1 ${comment.isLiked ? 'text-red-500' : ''}`}
                              >
                                <Heart className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                                <span>{comment.likesCount}</span>
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSongId(comment.songId)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                View Song
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-secondary">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No activity yet</p>
                    <p className="text-sm">Follow some artists to see their latest updates</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Join the Community</h3>
                <p className="text-text-secondary mb-4">
                  Sign in to follow artists, comment on songs, and discover new music
                </p>
                <Button>Sign In</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Artists You Follow</span>
                <Badge variant="secondary">
                  {followedArtists.length} following
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followedArtists.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {followedArtists.map((artist: Artist) => (
                    <div key={artist.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={artist.profileImageUrl || ''} />
                          <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="font-semibold">{artist.name}</h4>
                          <p className="text-sm text-text-secondary">
                            {artist.totalStreams.toLocaleString()} streams
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unfollowArtistMutation.mutate(artist.id)}
                        className="flex items-center space-x-1"
                      >
                        <UserMinus className="h-4 w-4" />
                        <span>Unfollow</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>You're not following any artists yet</p>
                  <p className="text-sm">Discover new artists to follow</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trending Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {suggestedArtists.map((artist: Artist) => (
                  <div key={artist.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={artist.profileImageUrl || ''} />
                        <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h4 className="font-semibold">{artist.name}</h4>
                        <p className="text-sm text-text-secondary">
                          {artist.totalStreams.toLocaleString()} streams
                        </p>
                        <p className="text-sm text-text-secondary">
                          ${artist.totalRevenue} earned
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant={artist.isFollowed ? "outline" : "default"}
                      size="sm"
                      onClick={() => 
                        artist.isFollowed 
                          ? unfollowArtistMutation.mutate(artist.id)
                          : followArtistMutation.mutate(artist.id)
                      }
                      className="flex items-center space-x-1"
                    >
                      {artist.isFollowed ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          <span>Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Song Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedSongId ? (
                <div className="text-center py-8 text-text-secondary">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a song to view comments</p>
                  <p className="text-sm">Visit the discovery page to find songs</p>
                </div>
              ) : (
                <>
                  {user && (
                    <div className="border rounded-lg p-4">
                      <Textarea
                        placeholder="Share your thoughts about this song..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="mb-3"
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        <Send className="h-4 w-4" />
                        <span>Post Comment</span>
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {songComments.map((comment: Comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={comment.user.profileImageUrl || ''} />
                            <AvatarFallback>
                              {getInitials(comment.user.firstName, comment.user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">
                                {comment.user.firstName} {comment.user.lastName}
                              </span>
                              <span className="text-sm text-text-secondary">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            
                            <p className="mt-2">{comment.content}</p>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => likeCommentMutation.mutate(comment.id)}
                              className={`mt-2 flex items-center space-x-1 ${comment.isLiked ? 'text-red-500' : ''}`}
                            >
                              <ThumbsUp className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                              <span>{comment.likesCount}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}