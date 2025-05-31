import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Play, Heart, ThumbsUp } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ArtistAnalytics() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get artist ID from URL
  const artistId = window.location.pathname.split('/').pop();
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: [`/api/artists/${artistId}/analytics`],
    enabled: !!artistId,
  });

  const { data: revenueBreakdown, isLoading: revenueLoading } = useQuery({
    queryKey: [`/api/artists/${artistId}/revenue-breakdown`],
    enabled: !!artistId,
  });

  const { data: tipDetails, isLoading: tipsLoading } = useQuery({
    queryKey: [`/api/artists/${artistId}/tips`],
    enabled: !!artistId,
  });

  // Thank you mutation
  const thankMutation = useMutation({
    mutationFn: async ({ tipId, reactionType }: { tipId: string; reactionType: 'thumbs_up' | 'heart' }) => {
      await apiRequest("POST", `/api/tips/${tipId}/thank`, { reactionType });
    },
    onSuccess: () => {
      toast({
        title: "Thank you sent!",
        description: "Your appreciation has been sent to the listener.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/artists/${artistId}/tips`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send thank you. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || revenueLoading || tipsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics Not Available</h2>
            <p className="text-gray-600 dark:text-gray-400">Unable to load analytics data.</p>
            <Button onClick={() => setLocation('/manager')} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { overview, recentStreams, topSongs, audienceInsights } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Artist Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Performance insights and revenue data</p>
          </div>
          <Button onClick={() => setLocation('/manager')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalStreams.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time streams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${overview.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">From paid streams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tips Received</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${overview.totalTips}</div>
              <p className="text-xs text-muted-foreground">From listener tips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Listeners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.monthlyListeners.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Unique listeners this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        {revenueBreakdown && revenueBreakdown.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>
                Where your earnings come from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {revenueBreakdown.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{source.source}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{source.percentage}% of total</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">${source.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Streams */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stream Activity</CardTitle>
              <CardDescription>
                Daily streams over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentStreams && recentStreams.length > 0 ? (
                <div className="space-y-4">
                  {recentStreams.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{day.date}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">{day.streams} streams</span>
                        <span className="text-sm text-green-600 dark:text-green-400">${day.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No recent stream data available</p>
              )}
            </CardContent>
          </Card>

          {/* Top Songs */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Songs</CardTitle>
              <CardDescription>
                Your most streamed tracks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topSongs && topSongs.length > 0 ? (
                <div className="space-y-4">
                  {topSongs.map((song, index) => (
                    <div key={song.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{song.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{song.streams} streams</p>
                        </div>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400">${song.revenue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No songs uploaded yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audience Insights */}
        {audienceInsights && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>
                  Where your listeners are from
                </CardDescription>
              </CardHeader>
              <CardContent>
                {audienceInsights.countries && audienceInsights.countries.length > 0 ? (
                  <div className="space-y-4">
                    {audienceInsights.countries.map((country, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{country.country}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{country.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No audience data available yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Tiers</CardTitle>
                <CardDescription>
                  Free vs paid listener breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {audienceInsights.subscriptionTiers && audienceInsights.subscriptionTiers.length > 0 ? (
                  <div className="space-y-4">
                    {audienceInsights.subscriptionTiers.map((tier, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{tier.tier}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{tier.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No subscription data available yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Tips & Thank You Section */}
        <div className="mt-8">
          <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Tips Received
              </CardTitle>
              <CardDescription>
                See who tipped you and send them a thank you message
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tipDetails && tipDetails.length > 0 ? (
                <div className="space-y-4">
                  {tipDetails.map((tip: any) => (
                    <div key={tip.id} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center gap-3">
                        <img 
                          src={tip.user.profileImageUrl || "/api/placeholder/40/40"} 
                          alt={tip.user.firstName || "Anonymous"} 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {tip.user.firstName || "Anonymous"} {tip.user.lastName || ""}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Tipped ${parseFloat(tip.amount).toFixed(2)} • {new Date(tip.createdAt).toLocaleDateString()}
                          </p>
                          {tip.message && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">
                              "{tip.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 w-8 p-0 ${tip.artistReaction === 'thumbs_up' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-blue-50 dark:hover:bg-blue-900/50'}`}
                          onClick={() => thankMutation.mutate({ tipId: tip.id, reactionType: 'thumbs_up' })}
                          disabled={thankMutation.isPending}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 w-8 p-0 ${tip.artistReaction === 'heart' ? 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400' : 'hover:bg-pink-50 dark:hover:bg-pink-900/50'}`}
                          onClick={() => thankMutation.mutate({ tipId: tip.id, reactionType: 'heart' })}
                          disabled={thankMutation.isPending}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No tips received yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    When listeners tip you, they'll appear here and you can thank them!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}