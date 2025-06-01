import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  accountType: varchar("account_type", { enum: ["listener", "artist", "manager", "admin"] }).notNull(),
  password: varchar("password"), // For traditional email/password auth
  isActive: boolean("is_active").default(true),
  isSuspended: boolean("is_suspended").default(false),
  suspensionReason: text("suspension_reason"),
  creditBalance: decimal("credit_balance", { precision: 10, scale: 2 }).default("0"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: varchar("subscription_tier", { enum: ["free", "basic", "premium"] }).default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artists table for detailed artist information
export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  bio: text("bio"),
  location: varchar("location"),
  genre: varchar("genre"),
  website: varchar("website"),
  profileImageUrl: varchar("profile_image_url"),
  bannerImageUrl: varchar("banner_image_url"),
  facebookHandle: varchar("facebook_handle"),
  twitterHandle: varchar("twitter_handle"),
  instagramHandle: varchar("instagram_handle"),
  tiktokHandle: varchar("tiktok_handle"),
  youtubeUrl: varchar("youtube_url"),
  totalStreams: integer("total_streams").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
  totalTips: decimal("total_tips", { precision: 10, scale: 2 }).default("0"),
  monthlyListeners: integer("monthly_listeners").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Songs table
export const songs = pgTable("songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: integer("artist_id").notNull().references(() => artists.id),
  title: varchar("title").notNull(),
  description: text("description"),
  fileUrl: varchar("file_url").notNull(),
  coverArtUrl: varchar("cover_art_url"),
  duration: integer("duration"), // in seconds
  aiGenerationMethod: varchar("ai_generation_method", { 
    enum: ["fully_ai", "ai_assisted", "ai_post_processing"] 
  }).notNull(),
  streamCount: integer("stream_count").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Albums table
export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: integer("artist_id").notNull().references(() => artists.id),
  title: varchar("title").notNull(),
  description: text("description"),
  coverArtUrl: varchar("cover_art_url"),
  releaseDate: timestamp("release_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Album songs junction table
export const albumSongs = pgTable("album_songs", {
  id: serial("id").primaryKey(),
  albumId: uuid("album_id").notNull().references(() => albums.id),
  songId: uuid("song_id").notNull().references(() => songs.id),
  trackNumber: integer("track_number"),
});

// Tips table
export const tips = pgTable("tips", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toArtistId: integer("to_artist_id").notNull().references(() => artists.id),
  songId: uuid("song_id").references(() => songs.id), // null for artist tips
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  trackingNumber: varchar("tracking_number").unique().notNull(),
  artistReaction: varchar("artist_reaction", { enum: ["thumbs_up", "heart"] }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Streams table for tracking
export const streams = pgTable("streams", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id), // null for anonymous plays
  songId: uuid("song_id").notNull().references(() => songs.id),
  isPaidUser: boolean("is_paid_user").default(false),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Playlists table
export const playlists = pgTable("playlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  coverImageUrl: varchar("cover_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Playlist songs junction table
export const playlistSongs = pgTable("playlist_songs", {
  id: serial("id").primaryKey(),
  playlistId: uuid("playlist_id").notNull().references(() => playlists.id),
  songId: uuid("song_id").notNull().references(() => songs.id),
  addedAt: timestamp("added_at").defaultNow(),
});

// Manager artists junction table
export const managerArtists = pgTable("manager_artists", {
  id: serial("id").primaryKey(),
  managerId: varchar("manager_id").notNull().references(() => users.id),
  artistId: integer("artist_id").notNull().references(() => artists.id),
  revenueShare: decimal("revenue_share", { precision: 5, scale: 2 }).default("15.00"), // percentage
  createdAt: timestamp("created_at").defaultNow(),
});

// Artist follows table
export const artistFollows = pgTable("artist_follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  artistId: integer("artist_id").notNull().references(() => artists.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Song comments table
export const songComments = pgTable("song_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  songId: uuid("song_id").notNull().references(() => songs.id),
  comment: text("comment").notNull(),
  parentId: uuid("parent_id").references(() => songComments.id), // for replies
  createdAt: timestamp("created_at").defaultNow(),
});

// Song reviews table
export const songReviews = pgTable("song_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  songId: uuid("song_id").notNull().references(() => songs.id),
  rating: integer("rating").notNull(), // 1-5 stars
  reviewText: text("review_text"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artist reviews table
export const artistReviews = pgTable("artist_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  artistId: integer("artist_id").notNull().references(() => artists.id),
  rating: integer("rating").notNull(), // 1-5 stars
  reviewText: text("review_text"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comment likes table
export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  commentId: uuid("comment_id").notNull().references(() => songComments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  artist: one(artists, {
    fields: [users.id],
    references: [artists.userId],
  }),
  playlists: many(playlists),
  managedArtists: many(managerArtists),
  followedArtists: many(artistFollows),
  songComments: many(songComments),
  songReviews: many(songReviews),
  artistReviews: many(artistReviews),
  commentLikes: many(commentLikes),
}));

export const artistsRelations = relations(artists, ({ one, many }) => ({
  user: one(users, {
    fields: [artists.userId],
    references: [users.id],
  }),
  songs: many(songs),
  albums: many(albums),
  tips: many(tips),
  managers: many(managerArtists),
  followers: many(artistFollows),
  reviews: many(artistReviews),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  artist: one(artists, {
    fields: [songs.artistId],
    references: [artists.id],
  }),
  streams: many(streams),
  tips: many(tips),
  playlistSongs: many(playlistSongs),
  albumSongs: many(albumSongs),
  comments: many(songComments),
  reviews: many(songReviews),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, {
    fields: [albums.artistId],
    references: [artists.id],
  }),
  albumSongs: many(albumSongs),
}));

export const tipsRelations = relations(tips, ({ one }) => ({
  fromUser: one(users, {
    fields: [tips.fromUserId],
    references: [users.id],
  }),
  toArtist: one(artists, {
    fields: [tips.toArtistId],
    references: [artists.id],
  }),
  song: one(songs, {
    fields: [tips.songId],
    references: [songs.id],
  }),
}));

export const streamsRelations = relations(streams, ({ one }) => ({
  user: one(users, {
    fields: [streams.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [streams.songId],
    references: [songs.id],
  }),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  playlistSongs: many(playlistSongs),
}));

export const managerArtistsRelations = relations(managerArtists, ({ one }) => ({
  manager: one(users, {
    fields: [managerArtists.managerId],
    references: [users.id],
  }),
  artist: one(artists, {
    fields: [managerArtists.artistId],
    references: [artists.id],
  }),
}));

export const artistFollowsRelations = relations(artistFollows, ({ one }) => ({
  follower: one(users, {
    fields: [artistFollows.followerId],
    references: [users.id],
  }),
  artist: one(artists, {
    fields: [artistFollows.artistId],
    references: [artists.id],
  }),
}));

export const songCommentsRelations = relations(songComments, ({ one, many }) => ({
  user: one(users, {
    fields: [songComments.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [songComments.songId],
    references: [songs.id],
  }),
  parent: one(songComments, {
    fields: [songComments.parentId],
    references: [songComments.id],
  }),
  replies: many(songComments),
  likes: many(commentLikes),
}));

export const songReviewsRelations = relations(songReviews, ({ one }) => ({
  user: one(users, {
    fields: [songReviews.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [songReviews.songId],
    references: [songs.id],
  }),
}));

export const artistReviewsRelations = relations(artistReviews, ({ one }) => ({
  user: one(users, {
    fields: [artistReviews.userId],
    references: [users.id],
  }),
  artist: one(artists, {
    fields: [artistReviews.artistId],
    references: [artists.id],
  }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
  comment: one(songComments, {
    fields: [commentLikes.commentId],
    references: [songComments.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
  createdAt: true,
  totalStreams: true,
  totalRevenue: true,
  totalTips: true,
  monthlyListeners: true,
});

export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
  createdAt: true,
  streamCount: true,
  revenue: true,
  isPublished: true,
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  createdAt: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
});

export const insertArtistFollowSchema = createInsertSchema(artistFollows).omit({
  id: true,
  createdAt: true,
});

export const insertSongCommentSchema = createInsertSchema(songComments).omit({
  id: true,
  createdAt: true,
});

export const insertSongReviewSchema = createInsertSchema(songReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArtistReviewSchema = createInsertSchema(artistReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentLikeSchema = createInsertSchema(commentLikes).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Album = typeof albums.$inferSelect;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Stream = typeof streams.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type ManagerArtist = typeof managerArtists.$inferSelect;
export type ArtistFollow = typeof artistFollows.$inferSelect;
export type InsertArtistFollow = z.infer<typeof insertArtistFollowSchema>;
export type SongComment = typeof songComments.$inferSelect;
export type InsertSongComment = z.infer<typeof insertSongCommentSchema>;
export type SongReview = typeof songReviews.$inferSelect;
export type InsertSongReview = z.infer<typeof insertSongReviewSchema>;
export type ArtistReview = typeof artistReviews.$inferSelect;
export type InsertArtistReview = z.infer<typeof insertArtistReviewSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;
