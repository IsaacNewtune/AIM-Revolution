import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Music, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Shield, 
  Ban, 
  UserX, 
  Eye,
  CheckCircle,
  XCircle,
  Trash2
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics']
  });

  // User management
  const [userFilters, setUserFilters] = useState({
    accountType: '',
    isActive: '',
    isSuspended: '',
    limit: 25,
    offset: 0
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users', userFilters]
  });

  // Content moderation
  const { data: moderationQueue, isLoading: moderationLoading } = useQuery({
    queryKey: ['/api/admin/moderation/queue']
  });

  // Mutations
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await apiRequest('PUT', `/api/admin/users/${userId}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User suspended successfully" });
    },
    onError: () => {
      toast({ title: "Failed to suspend user", variant: "destructive" });
    }
  });

  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('PUT', `/api/admin/users/${userId}/unsuspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User unsuspended successfully" });
    },
    onError: () => {
      toast({ title: "Failed to unsuspend user", variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
  });

  const updateAccountTypeMutation = useMutation({
    mutationFn: async ({ userId, accountType }: { userId: string; accountType: string }) => {
      await apiRequest('PUT', `/api/admin/users/${userId}/account-type`, { accountType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Account type updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update account type", variant: "destructive" });
    }
  });

  const moderateContentMutation = useMutation({
    mutationFn: async ({ type, id, action }: { type: string; id: string; action: string }) => {
      await apiRequest('POST', `/api/admin/moderation/${type}/${id}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/queue'] });
      toast({ title: "Content moderated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to moderate content", variant: "destructive" });
    }
  });

  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: '',
    userName: ''
  });
  const [suspensionReason, setSuspensionReason] = useState('');

  const handleSuspendUser = async () => {
    if (!suspensionReason.trim()) {
      toast({ title: "Please provide a suspension reason", variant: "destructive" });
      return;
    }
    
    await suspendUserMutation.mutateAsync({ 
      userId: suspendDialog.userId, 
      reason: suspensionReason 
    });
    
    setSuspendDialog({ open: false, userId: '', userName: '' });
    setSuspensionReason('');
  };

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform management and analytics</p>
        </div>
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <Shield className="w-4 h-4 mr-1" />
          Admin Access
        </Badge>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="moderation">Content Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics?.newUsersToday || 0} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Artists</CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalArtists || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.totalSongs || 0} songs uploaded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalStreams || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.activeUsersToday || 0} active today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics?.totalRevenue || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  Platform earnings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Growth Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Today</span>
                    <span className="font-semibold">{analytics?.newUsersToday || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week</span>
                    <span className="font-semibold">{analytics?.newUsersThisWeek || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <span className="font-semibold">{analytics?.newUsersThisMonth || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Artists by Streams</CardTitle>
                <CardDescription>Most popular artists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.topArtistsByStreams?.slice(0, 5).map((artist: any, index: number) => (
                    <div key={artist.id} className="flex justify-between items-center">
                      <span className="text-sm">#{index + 1} {artist.name}</span>
                      <Badge variant="outline">{artist.streams} streams</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics?.revenueByMonth?.map((month: any) => (
                  <div key={month.month} className="flex justify-between items-center">
                    <span>{month.month}</span>
                    <span className="font-semibold">${month.revenue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* User Filters */}
          <Card>
            <CardHeader>
              <CardTitle>User Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <Select
                  value={userFilters.accountType}
                  onValueChange={(value) => setUserFilters(prev => ({ ...prev, accountType: value, offset: 0 }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Account Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="listener">Listener</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={userFilters.isActive}
                  onValueChange={(value) => setUserFilters(prev => ({ ...prev, isActive: value, offset: 0 }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={userFilters.isSuspended}
                  onValueChange={(value) => setUserFilters(prev => ({ ...prev, isSuspended: value, offset: 0 }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Suspension" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Users</SelectItem>
                    <SelectItem value="false">Not Suspended</SelectItem>
                    <SelectItem value="true">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({usersData?.total || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Account Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.profileImageUrl && (
                              <img 
                                src={user.profileImageUrl} 
                                alt="" 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.accountType}
                            onValueChange={(value) => updateAccountTypeMutation.mutate({ userId: user.id, accountType: value })}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="listener">Listener</SelectItem>
                              <SelectItem value="artist">Artist</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {user.isSuspended && (
                              <Badge variant="destructive">Suspended</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!user.isSuspended ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSuspendDialog({
                                  open: true,
                                  userId: user.id,
                                  userName: `${user.firstName} ${user.lastName}`
                                })}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => unsuspendUserMutation.mutate(user.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Content Moderation Queue
              </CardTitle>
              <CardDescription>
                Review flagged content and take appropriate actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moderationLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {moderationQueue?.map((item: any) => (
                    <div key={`${item.type}-${item.id}`} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{item.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {item.type === 'song' && (
                            <div>
                              <p className="font-medium">{item.content.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Genre: {item.content.genre}
                              </p>
                            </div>
                          )}
                          
                          {item.type === 'comment' && (
                            <div>
                              <p className="text-sm">{item.content.content}</p>
                            </div>
                          )}
                          
                          {item.type === 'review' && (
                            <div>
                              <p className="text-sm">{item.content.reviewText}</p>
                              <p className="text-xs text-muted-foreground">
                                Rating: {item.content.rating}/5
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moderateContentMutation.mutate({
                              type: item.type,
                              id: item.id,
                              action: 'approve'
                            })}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moderateContentMutation.mutate({
                              type: item.type,
                              id: item.id,
                              action: 'reject'
                            })}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => moderateContentMutation.mutate({
                              type: item.type,
                              id: item.id,
                              action: 'remove'
                            })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {moderationQueue?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No items in moderation queue
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend {suspendDialog.userName}? Please provide a reason for the suspension.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Suspension Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for suspension..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialog({ open: false, userId: '', userName: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendUser}
              disabled={suspendUserMutation.isPending}
            >
              {suspendUserMutation.isPending ? "Suspending..." : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}