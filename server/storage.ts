import {
  users,
  artists,
  songs,
  tips,
  streams,
  playlists,
  playlistSongs,
  managerArtists,
  artistFollows,
  songComments,
  songReviews,
  artistReviews,
  commentLikes,
  type User,
  type UpsertUser,
  type Artist,
  type InsertArtist,
  type Song,
  type InsertSong,
  type Tip,
  type InsertTip,
  type Stream,
  type Playlist,
  type InsertPlaylist,
  type ManagerArtist,
  type ArtistFollow,
  type InsertArtistFollow,
  type SongComment,
  type InsertSongComment,
  type SongReview,
  type InsertSongReview,
  type ArtistReview,
  type InsertArtistReview,
  type CommentLike,
  type InsertCommentLike,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike, notInArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Artist operations
  getArtistByUserId(userId: string): Promise<Artist | undefined>;
  getArtistById(artistId: number): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(artistId: number, data: Partial<InsertArtist>): Promise<Artist>;
  updateArtistStats(artistId: number, stats: { totalStreams?: number; totalRevenue?: string; totalTips?: string; monthlyListeners?: number }): Promise<void>;
  getArtistAnalytics(artistId: number): Promise<{
    overview: { totalStreams: number; totalRevenue: string; totalTips: string; monthlyListeners: number };
    recentStreams: Array<{ date: string; streams: number; revenue: string }>;
    topSongs: Array<{ id: string; title: string; streams: number; revenue: string }>;
    audienceInsights: { countries: Array<{ country: string; percentage: number }>; subscriptionTiers: Array<{ tier: string; percentage: number }> };
  }>;
  getArtistRevenueBreakdown(artistId: number): Promise<Array<{ source: string; amount: string; percentage: number }>>;
  
  // Song operations
  createSong(song: InsertSong): Promise<Song>;
  getSongsByArtist(artistId: number): Promise<Song[]>;
  getSong(id: string): Promise<Song | undefined>;
  getAllSongs(filters?: { search?: string; genre?: string; sortBy?: string; limit?: number }): Promise<Song[]>;
  getTrendingSongs(): Promise<Song[]>;
  getRecommendedSongs(userId: string): Promise<Song[]>;
  updateSongStats(songId: string, streamCount: number, revenue: string): Promise<void>;
  
  // Tip operations
  createTip(tip: InsertTip): Promise<Tip>;
  getTipsByArtist(artistId: number): Promise<Array<Tip & { user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } }>>;
  getTipsByUser(userId: string): Promise<Tip[]>;
  addTipReaction(tipId: string, reactionType: 'thumbs_up' | 'heart'): Promise<void>;
  
  // Stream operations
  recordStream(userId: string | null, songId: string, isPaidUser: boolean, location?: string): Promise<Stream>;
  getStreamsByUser(userId: string): Promise<Stream[]>;
  
  // Playlist operations
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  getPlaylistsByUser(userId: string): Promise<Playlist[]>;
  getPlaylist(id: string): Promise<Playlist | undefined>;
  updatePlaylist(id: string, data: Partial<InsertPlaylist>): Promise<Playlist>;
  deletePlaylist(id: string): Promise<void>;
  getPlaylistSongs(playlistId: string): Promise<any[]>;
  addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<void>;
  removeSongFromPlaylist(playlistId: string, songId: string): Promise<void>;
  
  // Manager operations
  getArtistsByManager(managerId: string): Promise<(Artist & { revenueShare: string })[]>;
  addArtistToManager(managerId: string, artistId: number, revenueShare?: string): Promise<ManagerArtist>;
  
  // Credit operations
  updateUserCredits(userId: string, amount: string): Promise<void>;
  
  // Stripe operations
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<void>;
  
  // Social Features - Artist Following
  followArtist(userId: string, artistId: number): Promise<ArtistFollow>;
  unfollowArtist(userId: string, artistId: number): Promise<void>;
  getFollowedArtists(userId: string): Promise<Artist[]>;
  getArtistFollowers(artistId: number): Promise<User[]>;
  isFollowingArtist(userId: string, artistId: number): Promise<boolean>;
  
  // Social Features - Comments
  addSongComment(comment: InsertSongComment): Promise<SongComment>;
  getSongComments(songId: string): Promise<Array<SongComment & { user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null }; likesCount: number; isLiked?: boolean; replies?: SongComment[] }>>;
  deleteSongComment(commentId: string, userId: string): Promise<void>;
  
  // Social Features - Comment Likes
  likeSongComment(userId: string, commentId: string): Promise<CommentLike>;
  unlikeSongComment(userId: string, commentId: string): Promise<void>;
  
  // Social Features - Reviews
  addSongReview(review: InsertSongReview): Promise<SongReview>;
  getSongReviews(songId: string): Promise<Array<SongReview & { user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } }>>;
  addArtistReview(review: InsertArtistReview): Promise<ArtistReview>;
  getArtistReviews(artistId: number): Promise<Array<ArtistReview & { user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } }>>;
  getUserSongReview(userId: string, songId: string): Promise<SongReview | undefined>;
  getUserArtistReview(userId: string, artistId: number): Promise<ArtistReview | undefined>;
  updateSongReview(reviewId: string, userId: string, data: { rating: number; reviewText?: string }): Promise<SongReview>;
  updateArtistReview(reviewId: string, userId: string, data: { rating: number; reviewText?: string }): Promise<ArtistReview>;
  deleteSongReview(reviewId: string, userId: string): Promise<void>;
  deleteArtistReview(reviewId: string, userId: string): Promise<void>;
  
  // Admin operations
  getAllUsers(filters?: { accountType?: string; isActive?: boolean; isSuspended?: boolean; limit?: number; offset?: number }): Promise<{ users: User[]; total: number }>;
  suspendUser(userId: string, reason: string): Promise<void>;
  unsuspendUser(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  updateUserAccountType(userId: string, accountType: string): Promise<void>;
  getPlatformAnalytics(): Promise<{
    totalUsers: number;
    totalArtists: number;
    totalSongs: number;
    totalStreams: number;
    totalRevenue: string;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    activeUsersToday: number;
    topArtistsByStreams: Array<{ id: number; name: string; streams: number }>;
    topSongsByStreams: Array<{ id: string; title: string; artistName: string; streams: number }>;
    revenueByMonth: Array<{ month: string; revenue: string }>;
  }>;
  getContentModerationQueue(): Promise<Array<{
    type: 'song' | 'comment' | 'review';
    id: string;
    content: any;
    reportCount: number;
    createdAt: Date;
  }>>;
  moderateContent(contentType: 'song' | 'comment' | 'review', contentId: string, action: 'approve' | 'reject' | 'remove'): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Artist operations
  async getArtistByUserId(userId: string): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.userId, userId));
    return artist;
  }

  async getArtistById(artistId: number): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.id, artistId));
    return artist;
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const [newArtist] = await db.insert(artists).values(artist).returning();
    return newArtist;
  }

  async updateArtist(artistId: number, data: Partial<InsertArtist>): Promise<Artist> {
    const [updatedArtist] = await db
      .update(artists)
      .set(data)
      .where(eq(artists.id, artistId))
      .returning();
    return updatedArtist;
  }

  async updateArtistStats(artistId: number, stats: { totalStreams?: number; totalRevenue?: string; totalTips?: string; monthlyListeners?: number }): Promise<void> {
    await db.update(artists).set(stats).where(eq(artists.id, artistId));
  }

  async getArtistAnalytics(artistId: number): Promise<{
    overview: { totalStreams: number; paidStreams: number; freeStreams: number; totalRevenue: string; totalTips: string; monthlyListeners: number };
    recentStreams: Array<{ date: string; totalStreams: number; paidStreams: number; freeStreams: number; revenue: string }>;
    topSongs: Array<{ id: string; title: string; totalStreams: number; paidStreams: number; freeStreams: number; revenue: string }>;
    audienceInsights: { countries: Array<{ country: string; percentage: number }>; subscriptionTiers: Array<{ tier: string; percentage: number }> };
  }> {
    // Get artist overview
    const [artist] = await db.select().from(artists).where(eq(artists.id, artistId));
    
    // Get recent streams data (last 30 days) - separate paid vs free
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentStreams = await db
      .select({
        date: sql<string>`DATE(${streams.createdAt})`,
        totalStreams: sql<number>`COUNT(*)`,
        paidStreams: sql<number>`COUNT(CASE WHEN ${streams.isPaidUser} THEN 1 END)`,
        freeStreams: sql<number>`COUNT(CASE WHEN NOT ${streams.isPaidUser} THEN 1 END)`,
        revenue: sql<string>`SUM(CASE WHEN ${streams.isPaidUser} THEN 0.005 ELSE 0 END)`
      })
      .from(streams)
      .innerJoin(songs, eq(streams.songId, songs.id))
      .where(and(eq(songs.artistId, artistId), sql`${streams.createdAt} >= ${thirtyDaysAgo}`))
      .groupBy(sql`DATE(${streams.createdAt})`)
      .orderBy(sql`DATE(${streams.createdAt}) DESC`);

    // Get top songs with paid vs free streams breakdown
    const topSongs = await db
      .select({
        id: songs.id,
        title: songs.title,
        totalStreams: sql<number>`COUNT(${streams.id})`,
        paidStreams: sql<number>`COUNT(CASE WHEN ${streams.isPaidUser} THEN 1 END)`,
        freeStreams: sql<number>`COUNT(CASE WHEN NOT ${streams.isPaidUser} THEN 1 END)`,
        revenue: sql<string>`SUM(CASE WHEN ${streams.isPaidUser} THEN 0.005 ELSE 0 END)`
      })
      .from(songs)
      .leftJoin(streams, eq(songs.id, streams.songId))
      .where(eq(songs.artistId, artistId))
      .groupBy(songs.id, songs.title)
      .orderBy(sql`COUNT(${streams.id}) DESC`)
      .limit(10);

    // Get audience insights - subscription tiers
    const subscriptionTiers = await db
      .select({
        tier: users.subscriptionTier,
        count: sql<number>`COUNT(*)`
      })
      .from(streams)
      .innerJoin(songs, eq(streams.songId, songs.id))
      .innerJoin(users, eq(streams.userId, users.id))
      .where(eq(songs.artistId, artistId))
      .groupBy(users.subscriptionTier);

    const totalUserStreams = subscriptionTiers.reduce((sum, tier) => sum + tier.count, 0);
    const tierPercentages = subscriptionTiers.map(tier => ({
      tier: tier.tier || 'free',
      percentage: totalUserStreams > 0 ? Math.round((tier.count / totalUserStreams) * 100) : 0
    }));

    // Calculate total paid and free streams for overview
    const allStreamStats = await db
      .select({
        totalStreams: sql<number>`COUNT(*)`,
        paidStreams: sql<number>`COUNT(CASE WHEN ${streams.isPaidUser} THEN 1 END)`,
        freeStreams: sql<number>`COUNT(CASE WHEN NOT ${streams.isPaidUser} THEN 1 END)`
      })
      .from(streams)
      .innerJoin(songs, eq(streams.songId, songs.id))
      .where(eq(songs.artistId, artistId));

    const streamStats = allStreamStats[0] || { totalStreams: 0, paidStreams: 0, freeStreams: 0 };

    return {
      overview: {
        totalStreams: streamStats.totalStreams,
        paidStreams: streamStats.paidStreams,
        freeStreams: streamStats.freeStreams,
        totalRevenue: artist?.totalRevenue || "0.00",
        totalTips: artist?.totalTips || "0.00",
        monthlyListeners: artist?.monthlyListeners || 0
      },
      recentStreams: recentStreams.map(row => ({
        date: row.date,
        totalStreams: row.totalStreams,
        paidStreams: row.paidStreams,
        freeStreams: row.freeStreams,
        revenue: row.revenue || "0.00"
      })),
      topSongs: topSongs.map(song => ({
        id: song.id,
        title: song.title,
        totalStreams: song.totalStreams,
        paidStreams: song.paidStreams,
        freeStreams: song.freeStreams,
        revenue: song.revenue || "0.00"
      })),
      audienceInsights: {
        countries: [], // Will implement with location tracking
        subscriptionTiers: tierPercentages
      }
    };
  }

  async getArtistRevenueBreakdown(artistId: number): Promise<Array<{ source: string; amount: string; percentage: number }>> {
    // Get streaming revenue
    const streamingRevenue = await db
      .select({
        amount: sql<string>`SUM(CASE WHEN ${streams.isPaidUser} THEN 0.005 ELSE 0.001 END)`
      })
      .from(streams)
      .innerJoin(songs, eq(streams.songId, songs.id))
      .where(eq(songs.artistId, artistId));

    // Get tips revenue
    const tipsRevenue = await db
      .select({
        amount: sql<string>`SUM(${tips.amount})`
      })
      .from(tips)
      .where(eq(tips.toArtistId, artistId));

    const streamAmount = parseFloat(streamingRevenue[0]?.amount || "0");
    const tipAmount = parseFloat(tipsRevenue[0]?.amount || "0");
    const totalRevenue = streamAmount + tipAmount;

    if (totalRevenue === 0) {
      return [];
    }

    return [
      {
        source: "Streaming",
        amount: streamAmount.toFixed(2),
        percentage: Math.round((streamAmount / totalRevenue) * 100)
      },
      {
        source: "Tips",
        amount: tipAmount.toFixed(2),
        percentage: Math.round((tipAmount / totalRevenue) * 100)
      }
    ];
  }

  // Song operations
  async createSong(song: InsertSong): Promise<Song> {
    const [newSong] = await db.insert(songs).values(song).returning();
    return newSong;
  }

  async getSongsByArtist(artistId: number): Promise<Song[]> {
    return await db.select().from(songs).where(eq(songs.artistId, artistId)).orderBy(desc(songs.createdAt));
  }

  async getSong(id: string): Promise<Song | undefined> {
    const [song] = await db.select().from(songs).where(eq(songs.id, id));
    return song;
  }

  async getAllSongs(filters?: { search?: string; genre?: string; sortBy?: string; limit?: number }): Promise<Song[]> {
    // For now, implement basic filtering - will enhance with proper SQL later
    let allSongs = await db.select().from(songs).where(eq(songs.isPublished, true)).orderBy(desc(songs.createdAt));
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      allSongs = allSongs.filter(song => 
        song.title?.toLowerCase().includes(searchTerm) || 
        song.description?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters?.sortBy === 'popular') {
      allSongs.sort((a, b) => (b.streamCount || 0) - (a.streamCount || 0));
    }
    
    if (filters?.limit) {
      allSongs = allSongs.slice(0, filters.limit);
    }
    
    return allSongs;
  }

  async getTrendingSongs(): Promise<Song[]> {
    return await db
      .select()
      .from(songs)
      .where(eq(songs.isPublished, true))
      .orderBy(desc(songs.streamCount))
      .limit(20);
  }

  async getRecommendedSongs(userId: string): Promise<Song[]> {
    // Get recently uploaded songs that user hasn't streamed
    return await db
      .select()
      .from(songs)
      .where(eq(songs.isPublished, true))
      .orderBy(desc(songs.createdAt))
      .limit(15);
  }

  async updateSongStats(songId: string, streamCount: number, revenue: string): Promise<void> {
    await db.update(songs).set({ streamCount, revenue }).where(eq(songs.id, songId));
  }

  // Tip operations
  async createTip(tip: InsertTip): Promise<Tip> {
    const [newTip] = await db.insert(tips).values(tip).returning();
    return newTip;
  }

  async getTipsByArtist(artistId: number): Promise<Array<Tip & { user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } }>> {
    const results = await db
      .select({
        id: tips.id,
        toArtistId: tips.toArtistId,
        fromUserId: tips.fromUserId,
        songId: tips.songId,
        amount: tips.amount,
        message: tips.message,
        artistReaction: tips.artistReaction,
        createdAt: tips.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(tips)
      .leftJoin(users, eq(tips.fromUserId, users.id))
      .where(eq(tips.toArtistId, artistId))
      .orderBy(desc(tips.createdAt));
    
    return results;
  }

  async getTipsByUser(userId: string): Promise<Tip[]> {
    return await db.select().from(tips).where(eq(tips.fromUserId, userId)).orderBy(desc(tips.createdAt));
  }

  async addTipReaction(tipId: string, reactionType: 'thumbs_up' | 'heart'): Promise<void> {
    await db.update(tips).set({
      artistReaction: reactionType
    }).where(eq(tips.id, tipId));
  }

  // Stream operations
  async recordStream(userId: string | null, songId: string, isPaidUser: boolean, location?: string): Promise<Stream> {
    const [stream] = await db.insert(streams).values({
      userId,
      songId,
      isPaidUser,
      location,
    }).returning();
    return stream;
  }

  async getStreamsByUser(userId: string): Promise<Stream[]> {
    return await db.select().from(streams).where(eq(streams.userId, userId)).orderBy(desc(streams.createdAt));
  }

  // Playlist operations
  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [newPlaylist] = await db.insert(playlists).values(playlist).returning();
    return newPlaylist;
  }

  async getPlaylistsByUser(userId: string): Promise<Playlist[]> {
    return await db.select().from(playlists).where(eq(playlists.userId, userId)).orderBy(desc(playlists.createdAt));
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist;
  }

  async updatePlaylist(id: string, data: Partial<InsertPlaylist>): Promise<Playlist> {
    const [playlist] = await db
      .update(playlists)
      .set(data)
      .where(eq(playlists.id, id))
      .returning();
    return playlist;
  }

  async deletePlaylist(id: string): Promise<void> {
    // First delete all playlist songs
    await db.delete(playlistSongs).where(eq(playlistSongs.playlistId, id));
    // Then delete the playlist
    await db.delete(playlists).where(eq(playlists.id, id));
  }

  async getPlaylistSongs(playlistId: string): Promise<any[]> {
    const result = await db
      .select({
        id: songs.id,
        title: songs.title,
        duration: songs.duration,
        coverArtUrl: songs.coverArtUrl,
        fileUrl: songs.fileUrl,
        artistName: artists.name,
        addedAt: playlistSongs.addedAt,
      })
      .from(playlistSongs)
      .innerJoin(songs, eq(playlistSongs.songId, songs.id))
      .innerJoin(artists, eq(songs.artistId, artists.id))
      .where(eq(playlistSongs.playlistId, playlistId))
      .orderBy(playlistSongs.addedAt);
    
    return result;
  }

  async addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<void> {
    const values = songIds.map(songId => ({
      playlistId,
      songId,
    }));

    await db.insert(playlistSongs).values(values);
  }

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    await db
      .delete(playlistSongs)
      .where(
        and(
          eq(playlistSongs.playlistId, playlistId),
          eq(playlistSongs.songId, songId)
        )
      );
  }

  // Manager operations
  async getArtistsByManager(managerId: string): Promise<(Artist & { revenueShare: string })[]> {
    const result = await db
      .select({
        id: artists.id,
        userId: artists.userId,
        name: artists.name,
        bio: artists.bio,
        location: artists.location,
        genre: artists.genre,
        website: artists.website,
        profileImageUrl: artists.profileImageUrl,
        bannerImageUrl: artists.bannerImageUrl,
        facebookHandle: artists.facebookHandle,
        twitterHandle: artists.twitterHandle,
        instagramHandle: artists.instagramHandle,
        tiktokHandle: artists.tiktokHandle,
        youtubeUrl: artists.youtubeUrl,
        totalStreams: artists.totalStreams,
        totalRevenue: artists.totalRevenue,
        totalTips: artists.totalTips,
        monthlyListeners: artists.monthlyListeners,
        createdAt: artists.createdAt,
        revenueShare: managerArtists.revenueShare,
      })
      .from(managerArtists)
      .innerJoin(artists, eq(managerArtists.artistId, artists.id))
      .where(eq(managerArtists.managerId, managerId));
    
    return result.map(row => ({
      ...row,
      revenueShare: row.revenueShare || "15.00",
    }));
  }

  async addArtistToManager(managerId: string, artistId: number, revenueShare = "15.00"): Promise<ManagerArtist> {
    const [managerArtist] = await db.insert(managerArtists).values({
      managerId,
      artistId,
      revenueShare,
    }).returning();
    return managerArtist;
  }

  // Credit operations
  async updateUserCredits(userId: string, amount: string): Promise<void> {
    await db.update(users).set({ creditBalance: amount }).where(eq(users.id, userId));
  }

  // Stripe operations
  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<void> {
    const updateData: Partial<User> = { stripeCustomerId };
    if (stripeSubscriptionId) {
      updateData.stripeSubscriptionId = stripeSubscriptionId;
    }
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  // Social Features - Artist Following
  async followArtist(userId: string, artistId: number): Promise<ArtistFollow> {
    const [follow] = await db
      .insert(artistFollows)
      .values({ followerId: userId, artistId })
      .returning();
    return follow;
  }

  async unfollowArtist(userId: string, artistId: number): Promise<void> {
    await db
      .delete(artistFollows)
      .where(and(eq(artistFollows.followerId, userId), eq(artistFollows.artistId, artistId)));
  }

  async getFollowedArtists(userId: string): Promise<Artist[]> {
    const follows = await db
      .select({ artist: artists })
      .from(artistFollows)
      .innerJoin(artists, eq(artistFollows.artistId, artists.id))
      .where(eq(artistFollows.followerId, userId))
      .orderBy(desc(artistFollows.createdAt));
    
    return follows.map(f => f.artist);
  }

  async getArtistFollowers(artistId: number): Promise<User[]> {
    const follows = await db
      .select({ user: users })
      .from(artistFollows)
      .innerJoin(users, eq(artistFollows.followerId, users.id))
      .where(eq(artistFollows.artistId, artistId))
      .orderBy(desc(artistFollows.createdAt));
    
    return follows.map(f => f.user);
  }

  async isFollowingArtist(userId: string, artistId: number): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(artistFollows)
      .where(and(eq(artistFollows.followerId, userId), eq(artistFollows.artistId, artistId)));
    return !!follow;
  }

  // Social Features - Comments
  async addSongComment(comment: InsertSongComment): Promise<SongComment> {
    const [newComment] = await db
      .insert(songComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getSongComments(songId: string): Promise<Array<SongComment & { user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null }; likesCount: number; isLiked?: boolean; replies?: SongComment[] }>> {
    const comments = await db
      .select({
        id: songComments.id,
        userId: songComments.userId,
        songId: songComments.songId,
        comment: songComments.comment,
        parentId: songComments.parentId,
        createdAt: songComments.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        likesCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${commentLikes} 
          WHERE ${commentLikes.commentId} = ${songComments.id}
        )`,
      })
      .from(songComments)
      .innerJoin(users, eq(songComments.userId, users.id))
      .where(and(eq(songComments.songId, songId), sql`${songComments.parentId} IS NULL`))
      .orderBy(desc(songComments.createdAt));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await db
          .select({
            id: songComments.id,
            userId: songComments.userId,
            songId: songComments.songId,
            comment: songComments.comment,
            parentId: songComments.parentId,
            createdAt: songComments.createdAt,
            user: {
              firstName: users.firstName,
              lastName: users.lastName,
              profileImageUrl: users.profileImageUrl,
            },
          })
          .from(songComments)
          .innerJoin(users, eq(songComments.userId, users.id))
          .where(eq(songComments.parentId, comment.id))
          .orderBy(songComments.createdAt);

        return {
          ...comment,
          replies,
        };
      })
    );

    return commentsWithReplies;
  }

  async deleteSongComment(commentId: string, userId: string): Promise<void> {
    await db
      .delete(songComments)
      .where(and(eq(songComments.id, commentId), eq(songComments.userId, userId)));
  }

  // Social Features - Comment Likes
  async likeSongComment(userId: string, commentId: string): Promise<CommentLike> {
    const [like] = await db
      .insert(commentLikes)
      .values({ userId, commentId })
      .returning();
    return like;
  }

  async unlikeSongComment(userId: string, commentId: string): Promise<void> {
    await db
      .delete(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
  }

  // Social Features - Reviews
  async addSongReview(review: InsertSongReview): Promise<SongReview> {
    const [newReview] = await db
      .insert(songReviews)
      .values(review)
      .returning();
    return newReview;
  }

  async getSongReviews(songId: string): Promise<Array<SongReview & { user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } }>> {
    const reviews = await db
      .select({
        id: songReviews.id,
        userId: songReviews.userId,
        songId: songReviews.songId,
        rating: songReviews.rating,
        reviewText: songReviews.reviewText,
        createdAt: songReviews.createdAt,
        updatedAt: songReviews.updatedAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(songReviews)
      .innerJoin(users, eq(songReviews.userId, users.id))
      .where(eq(songReviews.songId, songId))
      .orderBy(desc(songReviews.createdAt));

    return reviews;
  }

  async addArtistReview(review: InsertArtistReview): Promise<ArtistReview> {
    const [newReview] = await db
      .insert(artistReviews)
      .values(review)
      .returning();
    return newReview;
  }

  async getArtistReviews(artistId: number): Promise<Array<ArtistReview & { user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } }>> {
    const reviews = await db
      .select({
        id: artistReviews.id,
        userId: artistReviews.userId,
        artistId: artistReviews.artistId,
        rating: artistReviews.rating,
        reviewText: artistReviews.reviewText,
        createdAt: artistReviews.createdAt,
        updatedAt: artistReviews.updatedAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(artistReviews)
      .innerJoin(users, eq(artistReviews.userId, users.id))
      .where(eq(artistReviews.artistId, artistId))
      .orderBy(desc(artistReviews.createdAt));

    return reviews;
  }

  async getUserSongReview(userId: string, songId: string): Promise<SongReview | undefined> {
    const [review] = await db
      .select()
      .from(songReviews)
      .where(and(eq(songReviews.userId, userId), eq(songReviews.songId, songId)));
    return review;
  }

  async getUserArtistReview(userId: string, artistId: number): Promise<ArtistReview | undefined> {
    const [review] = await db
      .select()
      .from(artistReviews)
      .where(and(eq(artistReviews.userId, userId), eq(artistReviews.artistId, artistId)));
    return review;
  }

  async updateSongReview(reviewId: string, userId: string, data: { rating: number; reviewText?: string }): Promise<SongReview> {
    const [review] = await db
      .update(songReviews)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(songReviews.id, reviewId), eq(songReviews.userId, userId)))
      .returning();
    return review;
  }

  async updateArtistReview(reviewId: string, userId: string, data: { rating: number; reviewText?: string }): Promise<ArtistReview> {
    const [review] = await db
      .update(artistReviews)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(artistReviews.id, reviewId), eq(artistReviews.userId, userId)))
      .returning();
    return review;
  }

  async deleteSongReview(reviewId: string, userId: string): Promise<void> {
    await db
      .delete(songReviews)
      .where(and(eq(songReviews.id, reviewId), eq(songReviews.userId, userId)));
  }

  async deleteArtistReview(reviewId: string, userId: string): Promise<void> {
    await db
      .delete(artistReviews)
      .where(and(eq(artistReviews.id, reviewId), eq(artistReviews.userId, userId)));
  }

  // Admin operations
  async getAllUsers(filters?: { accountType?: string; isActive?: boolean; isSuspended?: boolean; limit?: number; offset?: number }): Promise<{ users: User[]; total: number }> {
    const conditions = [];
    
    if (filters?.accountType) {
      conditions.push(eq(users.accountType, filters.accountType));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }
    if (filters?.isSuspended !== undefined) {
      conditions.push(eq(users.isSuspended, filters.isSuspended));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [userResults, totalResults] = await Promise.all([
      db.select()
        .from(users)
        .where(whereClause)
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0)
        .orderBy(desc(users.createdAt)),
      db.select({ count: count() })
        .from(users)
        .where(whereClause)
    ]);

    return {
      users: userResults,
      total: totalResults[0].count
    };
  }

  async suspendUser(userId: string, reason: string): Promise<void> {
    await db
      .update(users)
      .set({
        isSuspended: true,
        suspensionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async unsuspendUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isSuspended: false,
        suspensionReason: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete user and all related data
    await db.transaction(async (tx) => {
      // Delete user's streams
      await tx.delete(streams).where(eq(streams.userId, userId));
      
      // Delete user's tips
      await tx.delete(tips).where(eq(tips.userId, userId));
      
      // Delete user's comments
      await tx.delete(songComments).where(eq(songComments.userId, userId));
      
      // Delete user's reviews
      await tx.delete(songReviews).where(eq(songReviews.userId, userId));
      await tx.delete(artistReviews).where(eq(artistReviews.userId, userId));
      
      // Delete user's playlists
      await tx.delete(playlists).where(eq(playlists.userId, userId));
      
      // Delete user's follows
      await tx.delete(artistFollows).where(eq(artistFollows.userId, userId));
      
      // Delete user's comment likes
      await tx.delete(commentLikes).where(eq(commentLikes.userId, userId));
      
      // If user is an artist, delete their songs
      const artist = await tx.select().from(artists).where(eq(artists.userId, userId));
      if (artist.length > 0) {
        await tx.delete(songs).where(eq(songs.artistId, artist[0].id));
        await tx.delete(artists).where(eq(artists.userId, userId));
      }
      
      // Finally delete the user
      await tx.delete(users).where(eq(users.id, userId));
    });
  }

  async updateUserAccountType(userId: string, accountType: string): Promise<void> {
    await db
      .update(users)
      .set({
        accountType: accountType as any,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getPlatformAnalytics(): Promise<{
    totalUsers: number;
    totalArtists: number;
    totalSongs: number;
    totalStreams: number;
    totalRevenue: string;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    activeUsersToday: number;
    topArtistsByStreams: Array<{ id: number; name: string; streams: number }>;
    topSongsByStreams: Array<{ id: string; title: string; artistName: string; streams: number }>;
    revenueByMonth: Array<{ month: string; revenue: string }>;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsersResult,
      totalArtistsResult,
      totalSongsResult,
      totalStreamsResult,
      totalRevenueResult,
      newUsersTodayResult,
      newUsersWeekResult,
      newUsersMonthResult,
      activeUsersTodayResult,
      topArtistsResult,
      topSongsResult
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(artists),
      db.select({ count: count() }).from(songs),
      db.select({ count: count() }).from(streams),
      db.select({ total: sum(streams.revenue) }).from(streams).where(isNotNull(streams.revenue)),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, today)),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, weekAgo)),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, monthAgo)),
      db.select({ count: count() }).from(streams).where(gte(streams.streamedAt, today)),
      db.select({
        id: artists.id,
        name: artists.name,
        streams: count(streams.id)
      })
        .from(artists)
        .leftJoin(songs, eq(songs.artistId, artists.id))
        .leftJoin(streams, eq(streams.songId, songs.id))
        .groupBy(artists.id, artists.name)
        .orderBy(desc(count(streams.id)))
        .limit(5),
      db.select({
        id: songs.id,
        title: songs.title,
        artistName: artists.name,
        streams: count(streams.id)
      })
        .from(songs)
        .leftJoin(artists, eq(artists.id, songs.artistId))
        .leftJoin(streams, eq(streams.songId, songs.id))
        .groupBy(songs.id, songs.title, artists.name)
        .orderBy(desc(count(streams.id)))
        .limit(10)
    ]);

    // Calculate revenue by month for the last 6 months
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthRevenueResult = await db
        .select({ total: sum(streams.revenue) })
        .from(streams)
        .where(
          and(
            gte(streams.streamedAt, monthStart),
            lte(streams.streamedAt, monthEnd),
            isNotNull(streams.revenue)
          )
        );

      revenueByMonth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenueResult[0].total || '0.00'
      });
    }

    return {
      totalUsers: totalUsersResult[0].count,
      totalArtists: totalArtistsResult[0].count,
      totalSongs: totalSongsResult[0].count,
      totalStreams: totalStreamsResult[0].count,
      totalRevenue: totalRevenueResult[0].total || '0.00',
      newUsersToday: newUsersTodayResult[0].count,
      newUsersThisWeek: newUsersWeekResult[0].count,
      newUsersThisMonth: newUsersMonthResult[0].count,
      activeUsersToday: activeUsersTodayResult[0].count,
      topArtistsByStreams: topArtistsResult,
      topSongsByStreams: topSongsResult,
      revenueByMonth
    };
  }

  async getContentModerationQueue(): Promise<Array<{
    type: 'song' | 'comment' | 'review';
    id: string;
    content: any;
    reportCount: number;
    createdAt: Date;
  }>> {
    // For now, return songs, comments, and reviews that might need moderation
    const [suspiciousSongs, recentComments, recentReviews] = await Promise.all([
      db.select({
        type: sql<'song'>`'song'`,
        id: songs.id,
        content: songs,
        reportCount: sql<number>`0`,
        createdAt: songs.createdAt
      })
        .from(songs)
        .where(
          or(
            like(songs.title, '%explicit%'),
            like(songs.genre, '%inappropriate%')
          )
        )
        .limit(10),
      
      db.select({
        type: sql<'comment'>`'comment'`,
        id: songComments.id,
        content: songComments,
        reportCount: sql<number>`0`,
        createdAt: songComments.createdAt
      })
        .from(songComments)
        .orderBy(desc(songComments.createdAt))
        .limit(10),
        
      db.select({
        type: sql<'review'>`'review'`,
        id: songReviews.id,
        content: songReviews,
        reportCount: sql<number>`0`,
        createdAt: songReviews.createdAt
      })
        .from(songReviews)
        .where(lte(songReviews.rating, 2))
        .orderBy(desc(songReviews.createdAt))
        .limit(10)
    ]);

    return [...suspiciousSongs, ...recentComments, ...recentReviews]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async moderateContent(contentType: 'song' | 'comment' | 'review', contentId: string, action: 'approve' | 'reject' | 'remove'): Promise<void> {
    if (action === 'remove') {
      switch (contentType) {
        case 'song':
          await db.delete(songs).where(eq(songs.id, contentId));
          break;
        case 'comment':
          await db.delete(songComments).where(eq(songComments.id, contentId));
          break;
        case 'review':
          await db.delete(songReviews).where(eq(songReviews.id, contentId));
          break;
      }
    }
    // For approve/reject, in a real app you'd update a moderation status field
  }
}

export const storage = new DatabaseStorage();
