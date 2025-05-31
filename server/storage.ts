import {
  users,
  artists,
  songs,
  tips,
  streams,
  playlists,
  managerArtists,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike, notInArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Artist operations
  getArtistByUserId(userId: string): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
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
  getTipsByArtist(artistId: number): Promise<Tip[]>;
  getTipsByUser(userId: string): Promise<Tip[]>;
  
  // Stream operations
  recordStream(userId: string | null, songId: string, isPaidUser: boolean, location?: string): Promise<Stream>;
  getStreamsByUser(userId: string): Promise<Stream[]>;
  
  // Playlist operations
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  getPlaylistsByUser(userId: string): Promise<Playlist[]>;
  
  // Manager operations
  getArtistsByManager(managerId: string): Promise<(Artist & { revenueShare: string })[]>;
  addArtistToManager(managerId: string, artistId: number, revenueShare?: string): Promise<ManagerArtist>;
  
  // Credit operations
  updateUserCredits(userId: string, amount: string): Promise<void>;
  
  // Stripe operations
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<void>;
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

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const [newArtist] = await db.insert(artists).values(artist).returning();
    return newArtist;
  }

  async updateArtistStats(artistId: number, stats: { totalStreams?: number; totalRevenue?: string; totalTips?: string; monthlyListeners?: number }): Promise<void> {
    await db.update(artists).set(stats).where(eq(artists.id, artistId));
  }

  async getArtistAnalytics(artistId: number): Promise<{
    overview: { totalStreams: number; totalRevenue: string; totalTips: string; monthlyListeners: number };
    recentStreams: Array<{ date: string; streams: number; revenue: string }>;
    topSongs: Array<{ id: string; title: string; streams: number; revenue: string }>;
    audienceInsights: { countries: Array<{ country: string; percentage: number }>; subscriptionTiers: Array<{ tier: string; percentage: number }> };
  }> {
    // Get artist overview
    const [artist] = await db.select().from(artists).where(eq(artists.id, artistId));
    
    // Get recent streams data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentStreams = await db
      .select({
        date: sql<string>`DATE(${streams.createdAt})`,
        streams: sql<number>`COUNT(*)`,
        revenue: sql<string>`SUM(CASE WHEN ${streams.isPaidUser} THEN 0.005 ELSE 0.001 END)`
      })
      .from(streams)
      .innerJoin(songs, eq(streams.songId, songs.id))
      .where(and(eq(songs.artistId, artistId), sql`${streams.createdAt} >= ${thirtyDaysAgo}`))
      .groupBy(sql`DATE(${streams.createdAt})`)
      .orderBy(sql`DATE(${streams.createdAt}) DESC`);

    // Get top songs
    const topSongs = await db
      .select({
        id: songs.id,
        title: songs.title,
        streams: sql<number>`COUNT(${streams.id})`,
        revenue: sql<string>`SUM(CASE WHEN ${streams.isPaidUser} THEN 0.005 ELSE 0.001 END)`
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

    return {
      overview: {
        totalStreams: artist?.totalStreams || 0,
        totalRevenue: artist?.totalRevenue || "0.00",
        totalTips: artist?.totalTips || "0.00",
        monthlyListeners: artist?.monthlyListeners || 0
      },
      recentStreams: recentStreams.map(row => ({
        date: row.date,
        streams: row.streams,
        revenue: row.revenue || "0.00"
      })),
      topSongs: topSongs.map(song => ({
        id: song.id,
        title: song.title,
        streams: song.streams,
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

  async getTipsByArtist(artistId: number): Promise<Tip[]> {
    return await db.select().from(tips).where(eq(tips.toArtistId, artistId)).orderBy(desc(tips.createdAt));
  }

  async getTipsByUser(userId: string): Promise<Tip[]> {
    return await db.select().from(tips).where(eq(tips.fromUserId, userId)).orderBy(desc(tips.createdAt));
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

  // Manager operations
  async getArtistsByManager(managerId: string): Promise<(Artist & { revenueShare: string })[]> {
    const result = await db
      .select({
        ...artists,
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
}

export const storage = new DatabaseStorage();
