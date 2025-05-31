import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { TrendingUp, DollarSign, Users, Music, Calendar, Award, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ArtistAnalytics() {
  const { user } = useAuth();

  // Get artist data first
  const { data: artist } = useQuery({
    queryKey: ["/api/artist/profile"],
  });

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/artists", artist?.id, "analytics"],
    enabled: !!artist?.id,
  });

  // Fetch revenue breakdown
  const { data: revenueBreakdown = [], isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/artists", artist?.id, "revenue-breakdown"],
    enabled: !!artist?.id,
  });

  if (analyticsLoading || revenueLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {
    totalStreams: 0,
    totalRevenue: "0.00",
    totalTips: "0.00",
    monthlyListeners: 0
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your performance and revenue across the platform</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Music className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Total Streams</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{overview.totalStreams.toLocaleString()}</div>
              <div className="text-xs text-gray-500">All time</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">${overview.totalRevenue}</div>
              <div className="text-xs text-gray-500">From streaming</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">Tips Received</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">${overview.totalTips}</div>
              <div className="text-xs text-gray-500">From fans</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Monthly Listeners</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{overview.monthlyListeners.toLocaleString()}</div>
              <div className="text-xs text-gray-500">This month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="streams" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="streams">Stream History</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="songs">Top Songs</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Streaming Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics?.recentStreams || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="streams" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percentage }) => `${source}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {revenueBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenueBreakdown.map((item: any, index: number) => (
                  <div key={item.source} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.source}</span>
                      <span className="text-lg font-bold">${item.amount}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                    <div className="text-sm text-gray-500">{item.percentage}% of total revenue</div>
                  </div>
                ))}
                {revenueBreakdown.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No revenue data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="songs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Songs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics?.topSongs || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="streams" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Song Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topSongs?.map((song: any, index: number) => (
                  <div key={song.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <h4 className="font-semibold">{song.title}</h4>
                        <p className="text-sm text-gray-600">{song.streams} streams</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${song.revenue}</div>
                      <div className="text-sm text-gray-500">Revenue</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No song data available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Audience by Subscription Tier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.audienceInsights?.subscriptionTiers || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ tier, percentage }) => `${tier}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {(analytics?.audienceInsights?.subscriptionTiers || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics?.audienceInsights?.subscriptionTiers?.map((tier: any, index: number) => (
                  <div key={tier.tier} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">{tier.tier} Users</span>
                      <span className="text-lg font-bold">{tier.percentage}%</span>
                    </div>
                    <Progress value={tier.percentage} className="h-2" />
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No audience data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Recent Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics?.recentStreams?.reduce((sum: number, day: any) => sum + day.streams, 0) || 0}
              </div>
              <div className="text-sm text-blue-600">Streams (30 days)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${analytics?.recentStreams?.reduce((sum: number, day: any) => sum + parseFloat(day.revenue || "0"), 0).toFixed(2) || "0.00"}
              </div>
              <div className="text-sm text-green-600">Revenue (30 days)</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.topSongs?.length || 0}
              </div>
              <div className="text-sm text-purple-600">Published Songs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}