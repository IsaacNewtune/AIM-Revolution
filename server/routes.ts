import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { 
  insertSongSchema, 
  insertTipSchema, 
  insertPlaylistSchema, 
  insertArtistSchema,
  insertSongCommentSchema,
  insertSongReviewSchema,
  insertArtistReviewSchema,
  songs,
  artists,
  playlists,
  users
} from "@shared/schema";
import { eq, and, sql, or } from "drizzle-orm";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio' || file.fieldname.startsWith('songFile_')) {
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid audio file type'));
      }
    } else if (file.fieldname === 'artwork' || file.fieldname === 'coverArt' || file.fieldname === 'profileImage' || file.fieldname === 'bannerImage') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image file type'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

// Use memory store for session to avoid database conflicts
import MemoryStore from "memorystore";
const MemStore = MemoryStore(session);

const sessionSettings: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  store: new MemStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Middleware for checking authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session(sessionSettings));

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with hashed password (no account type set initially)
      const newUser = await storage.upsertUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        accountType: null, // Set to null so user is directed to account selection
        profileImageUrl: null,
        isActive: true,
        isSuspended: false,
        suspensionReason: null,
        creditBalance: "0",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionTier: 'free',
      });

      // Create session
      (req as any).session.userId = newUser.id;
      
      res.status(201).json({ 
        message: "User created successfully",
        user: { ...newUser, password: undefined }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // For development, if user doesn't have a password, set one
      if (!user.password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await storage.upsertUser({ ...user, password: hashedPassword });
      } else {
        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
      }

      // Create session
      (req as any).session.userId = user.id;
      
      res.json({ 
        message: "Login successful",
        user: { ...user, password: undefined }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Account type selection endpoint
  app.post('/api/auth/account-type', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { accountType } = req.body;

      if (!accountType || !['listener', 'artist', 'manager'].includes(accountType)) {
        return res.status(400).json({ message: "Valid account type is required" });
      }

      await storage.updateUserAccountType(userId, accountType);
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating account type:", error);
      res.status(500).json({ message: "Failed to update account type" });
    }
  });

  // Traditional email/password authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { firstName, lastName, email, password, accountType } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with email-based ID for traditional auth
      const userId = email.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now();
      
      const user = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        accountType: accountType || "listener",
        password: hashedPassword,
      });

      // Create session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.status(201).json(userResponse);

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("Login attempt for email:", email);

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      console.log("User found:", user ? "Yes" : "No");
      
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Create session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json(userResponse);

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout route
  app.get('/api/logout', async (req: any, res) => {
    try {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Logout failed" });
          }
          res.clearCookie('connect.sid');
          res.redirect('/');
        });
      } else {
        res.redirect('/');
      }
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.put('/api/auth/user/account-type', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { accountType } = req.body;
      
      if (!['listener', 'artist', 'manager'].includes(accountType)) {
        return res.status(400).json({ message: "Invalid account type" });
      }
      
      await storage.updateUserAccountType(userId, accountType);
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating account type:", error);
      res.status(500).json({ message: "Failed to update account type" });
    }
  });

  // User routes
  app.post('/api/user/update-profile', requireAuth, upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'headerImage', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { firstName, lastName, bio, location } = req.body;
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const profileImageFile = files.profileImage?.[0];
      const headerImageFile = files.headerImage?.[0];

      // Update user profile
      await storage.upsertUser({
        id: userId,
        email: req.session.userId,
        firstName,
        lastName,
        profileImageUrl: profileImageFile ? `/uploads/${profileImageFile.filename}` : req.session.userId,
        accountType: req.body.accountType || 'listener',
      });

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/user/setup', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { accountType, name, bio, location } = req.body;

      // Update user account type
      await storage.upsertUser({
        id: userId,
        email: req.session.userId,
        firstName: req.session.userId,
        lastName: req.session.userId,
        profileImageUrl: req.session.userId,
        accountType,
      });

      // If artist or manager, create artist profile
      if (accountType === 'artist' || accountType === 'manager') {
        const artistData = insertArtistSchema.parse({
          userId,
          name: name || `${req.session.userId || ''} ${req.session.userId || ''}`.trim(),
          bio,
          location,
        });
        await storage.createArtist(artistData);
      }

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error setting up user:", error);
      res.status(400).json({ message: "Failed to setup user profile" });
    }
  });

  // Artist routes
  app.post('/api/artists', requireAuth, upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.accountType !== 'manager') {
        return res.status(403).json({ message: "Only managers can create artist profiles" });
      }
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const profileImagePath = files?.profileImage?.[0]?.path;
      const bannerImagePath = files?.bannerImage?.[0]?.path;
      
      const artistData = {
        name: req.body.name,
        bio: req.body.bio || null,
        location: req.body.location || null,
        genre: req.body.genre || null,
        website: req.body.website || null,
        facebookHandle: req.body.facebookHandle || null,
        twitterHandle: req.body.twitterHandle || null,
        instagramHandle: req.body.instagramHandle || null,
        tiktokHandle: req.body.tiktokHandle || null,
        youtubeUrl: req.body.youtubeUrl || null,
        profileImageUrl: profileImagePath || null,
        bannerImageUrl: bannerImagePath || null,
        userId: userId
      };
      
      const artist = await storage.createArtist(artistData);
      
      // Add the artist to the manager's managed artists
      await storage.addArtistToManager(userId, artist.id);
      
      res.json(artist);
    } catch (error) {
      console.error("Error creating artist:", error);
      res.status(500).json({ message: "Failed to create artist" });
    }
  });

  app.get('/api/artist/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const artist = await storage.getArtistByUserId(userId);
      if (!artist) {
        return res.status(404).json({ message: "Artist profile not found" });
      }
      res.json(artist);
    } catch (error) {
      console.error("Error fetching artist profile:", error);
      res.status(500).json({ message: "Failed to fetch artist profile" });
    }
  });

  // Song routes - Multiple song upload
  app.post('/api/songs/upload', requireAuth, upload.any(), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      console.log("Upload request received");
      console.log("req.body:", req.body);
      console.log("req.body.metadata:", req.body.metadata);
      console.log("req.files:", req.files);
      
      if (!req.body.metadata) {
        return res.status(400).json({ message: "No metadata provided" });
      }
      
      const metadata = JSON.parse(req.body.metadata);
      
      let artist: any;
      
      // If user is a manager and targetArtistId is provided, upload for that artist
      if (user?.accountType === 'manager' && metadata.targetArtistId) {
        artist = await storage.getArtistById(parseInt(metadata.targetArtistId));
        
        if (!artist) {
          return res.status(404).json({ message: "Target artist not found" });
        }
        
        // Verify the manager manages this artist
        const managedArtists = await storage.getArtistsByManager(userId);
        const managesThisArtist = managedArtists.some((a: any) => a.id === artist.id);
        
        if (!managesThisArtist) {
          return res.status(403).json({ message: "You don't manage this artist" });
        }
      } else {
        // Regular artist upload
        artist = await storage.getArtistByUserId(userId);
        
        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }
      }

      const files = req.files as Express.Multer.File[];
      
      // Find cover art file
      const coverArtFile = files.find(f => f.fieldname === 'coverArt');
      const coverArtUrl = coverArtFile ? `/uploads/${coverArtFile.filename}` : null;

      // Process each song
      const uploadedSongs = [];
      for (let i = 0; i < metadata.numberOfSongs; i++) {
        const songFile = files.find(f => f.fieldname === `songFile_${i}`);
        
        if (!songFile) {
          return res.status(400).json({ message: `Audio file missing for song ${i + 1}` });
        }

        const songMetadata = metadata.songs[i];
        
        const songData = insertSongSchema.parse({
          artistId: artist.id,
          title: songMetadata.title,
          description: metadata.albumTitle ? `From album: ${metadata.albumTitle}` : null,
          fileUrl: `/uploads/${songFile.filename}`,
          coverArtUrl: coverArtUrl,
          aiGenerationMethod: songMetadata.aiGenerator === 'Other' ? 'ai_assisted' : 
                             songMetadata.aiGenerator.toLowerCase().includes('suno') ? 'fully_ai' :
                             songMetadata.aiGenerator.toLowerCase().includes('udio') ? 'fully_ai' : 'ai_assisted',
          isPublished: false, // Set to false initially for review
        });

        const song = await storage.createSong(songData);
        uploadedSongs.push(song);
      }

      res.json({ 
        message: "Songs uploaded successfully", 
        songs: uploadedSongs,
        albumTitle: metadata.albumTitle 
      });
    } catch (error) {
      console.error("Error uploading songs:", error);
      res.status(400).json({ message: "Failed to upload songs" });
    }
  });

  app.get('/api/songs', async (req, res) => {
    try {
      const { search, genre, sortBy, limit } = req.query;
      const songs = await storage.getAllSongs({
        search: search as string,
        genre: genre as string,
        sortBy: sortBy as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json(songs);
    } catch (error) {
      console.error("Error fetching songs:", error);
      res.status(500).json({ message: "Failed to fetch songs" });
    }
  });

  app.get('/api/search/suggestions', async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.json({ artists: [], songs: [] });
      }

      const searchTerm = query.toLowerCase().trim();
      
      // Get matching artists
      const artists = await db
        .select({ id: artists.id, name: artists.name })
        .from(artists)
        .where(sql`LOWER(${artists.name}) LIKE ${`%${searchTerm}%`}`)
        .limit(5);

      // Get matching songs with artist info
      const songs = await db
        .select({
          id: songs.id,
          title: songs.title,
          artistName: artists.name
        })
        .from(songs)
        .innerJoin(artists, eq(songs.artistId, artists.id))
        .where(
          and(
            eq(songs.isPublished, true),
            sql`LOWER(${songs.title}) LIKE ${`%${searchTerm}%`}`
          )
        )
        .limit(5);

      res.json({ artists, songs });
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Comprehensive search endpoint
  app.get('/api/search', async (req, res) => {
    try {
      const { q: query, type = 'all', limit = 20 } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const searchTerm = query.toLowerCase().trim();
      const searchLimit = Math.min(parseInt(limit as string) || 20, 50);
      
      const results: any = {};

      if (type === 'all' || type === 'songs') {
        // Use storage method for songs search
        const songsResults = await storage.getAllSongs({
          search: searchTerm,
          limit: searchLimit
        });
        results.songs = songsResults;
      }

      if (type === 'all' || type === 'artists') {
        // Search artists using raw query to avoid TypeScript issues
        const artistResults = await db.execute(sql`
          SELECT id, user_id, name, bio, location, genre, profile_image_url, 
                 total_streams, total_revenue, monthly_listeners
          FROM artists 
          WHERE LOWER(name) LIKE ${`%${searchTerm}%`} 
             OR LOWER(bio) LIKE ${`%${searchTerm}%`}
             OR LOWER(genre) LIKE ${`%${searchTerm}%`}
             OR LOWER(location) LIKE ${`%${searchTerm}%`}
          LIMIT ${searchLimit}
        `);
        results.artists = artistResults.rows;
      }

      if (type === 'all' || type === 'playlists') {
        // Search public playlists
        const playlistResults = await db.execute(sql`
          SELECT p.id, p.user_id, p.title, p.description, p.is_public, 
                 p.cover_image_url, p.created_at, u.first_name, u.last_name
          FROM playlists p
          JOIN users u ON p.user_id = u.id
          WHERE p.is_public = true 
            AND (LOWER(p.title) LIKE ${`%${searchTerm}%`} 
                 OR LOWER(p.description) LIKE ${`%${searchTerm}%`})
          LIMIT ${searchLimit}
        `);
        results.playlists = playlistResults.rows;
      }

      // Add search metadata
      results.query = query;
      results.totalResults = Object.values(results).reduce((sum: number, arr: any) => 
        Array.isArray(arr) ? sum + arr.length : sum, 0);

      res.json(results);
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get('/api/songs/trending', async (req, res) => {
    try {
      const songs = await storage.getTrendingSongs();
      res.json(songs);
    } catch (error) {
      console.error("Error fetching trending songs:", error);
      res.status(500).json({ message: "Failed to fetch trending songs" });
    }
  });

  // Enhanced discovery endpoint with advanced filtering
  app.get("/api/songs/discover", async (req, res) => {
    try {
      const { query, genre, mood, aiMethod, sortBy, tags, limit } = req.query;
      const songs = await storage.discoverSongs({
        query: query as string,
        genre: genre as string,
        mood: mood as string,
        aiMethod: aiMethod as string,
        sortBy: sortBy as string,
        tags: tags ? (tags as string).split(',') : [],
        limit: limit ? parseInt(limit as string) : 50,
      });
      res.json(songs);
    } catch (error) {
      console.error("Error discovering songs:", error);
      res.status(500).json({ message: "Failed to discover songs" });
    }
  });

  // Get genre statistics
  app.get("/api/genres/stats", async (req, res) => {
    try {
      const stats = await storage.getGenreStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching genre stats:", error);
      res.status(500).json({ message: "Failed to fetch genre stats" });
    }
  });

  // Get mood statistics
  app.get("/api/moods/stats", async (req, res) => {
    try {
      const stats = await storage.getMoodStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching mood stats:", error);
      res.status(500).json({ message: "Failed to fetch mood stats" });
    }
  });

  app.get('/api/songs/recommendations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const songs = await storage.getRecommendedSongs(userId);
      res.json(songs);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.get('/api/songs/artist/:artistId', async (req, res) => {
    try {
      const artistId = parseInt(req.params.artistId);
      const songs = await storage.getSongsByArtist(artistId);
      res.json(songs);
    } catch (error) {
      console.error("Error fetching artist songs:", error);
      res.status(500).json({ message: "Failed to fetch artist songs" });
    }
  });

  app.get('/api/songs/:id', async (req, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      console.error("Error fetching song:", error);
      res.status(500).json({ message: "Failed to fetch song" });
    }
  });

  // Stream routes
  app.post('/api/streams', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { songId } = req.body;
      
      const user = await storage.getUser(userId);
      const isPaidUser = user?.subscriptionTier !== 'free';
      
      const stream = await storage.recordStream(userId, songId, isPaidUser);
      res.json(stream);
    } catch (error) {
      console.error("Error recording stream:", error);
      res.status(500).json({ message: "Failed to record stream" });
    }
  });

  app.get('/api/streams/history', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const streams = await storage.getStreamsByUser(userId);
      res.json(streams);
    } catch (error) {
      console.error("Error fetching stream history:", error);
      res.status(500).json({ message: "Failed to fetch stream history" });
    }
  });

  // Tip processing endpoint
  app.post('/api/tips', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { amount, songId, toArtistId } = req.body;
      
      if (!amount || !toArtistId) {
        return res.status(400).json({ message: "Amount and artist ID are required" });
      }

      // Get user's current credit balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const tipAmount = parseFloat(amount);
      const userBalance = parseFloat(user.creditBalance || '0');

      // Check if user has sufficient funds
      if (userBalance < tipAmount) {
        return res.status(400).send("Insufficient funds");
      }

      // Process the tip
      const tipData = {
        fromUserId: userId,
        toArtistId: parseInt(toArtistId),
        songId: songId || null,
        amount: amount.toString(),
        message: null,
        trackingNumber: `TIP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const tip = await storage.createTip(tipData);
      
      // Deduct from user's credit balance
      const newBalance = userBalance - tipAmount;
      await storage.updateUserCredits(userId, newBalance.toString());

      res.json({ tip, newBalance });
    } catch (error) {
      console.error("Error processing tip:", error);
      res.status(500).json({ message: "Failed to process tip" });
    }
  });

  // Get tips received by an artist
  app.get('/api/tips/received/:artistId', requireAuth, async (req: any, res) => {
    try {
      const artistId = parseInt(req.params.artistId);
      const tips = await storage.getTipsByArtist(artistId);
      res.json(tips);
    } catch (error) {
      console.error("Error fetching received tips:", error);
      res.status(500).json({ message: "Failed to fetch tips" });
    }
  });

  // Get tips sent by a user
  app.get('/api/tips/sent', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const tips = await storage.getTipsByUser(userId);
      res.json(tips);
    } catch (error) {
      console.error("Error fetching sent tips:", error);
      res.status(500).json({ message: "Failed to fetch sent tips" });
    }
  });

  // Playlist routes
  app.get("/api/playlists", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const playlists = await storage.getPlaylistsByUser(userId);
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });

  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.getPlaylist(id);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      // Check if playlist is public or user owns it
      if (!playlist.isPublic && (!req.user || req.user.claims?.sub !== playlist.userId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(playlist);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      res.status(500).json({ message: "Failed to fetch playlist" });
    }
  });

  app.get("/api/playlists/:id/songs", async (req, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.getPlaylist(id);
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      // Check if playlist is public or user owns it
      if (!playlist.isPublic && (!req.user || req.user.claims?.sub !== playlist.userId)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const songs = await storage.getPlaylistSongs(id);
      res.json(songs);
    } catch (error) {
      console.error("Error fetching playlist songs:", error);
      res.status(500).json({ message: "Failed to fetch playlist songs" });
    }
  });

  app.post("/api/playlists", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { title, description, isPublic } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ message: "Playlist title is required" });
      }

      const playlist = await storage.createPlaylist({
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        isPublic: Boolean(isPublic)
      });

      res.status(201).json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });

  app.put("/api/playlists/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      const { title, description, isPublic } = req.body;

      const playlist = await storage.getPlaylist(id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!title?.trim()) {
        return res.status(400).json({ message: "Playlist title is required" });
      }

      const updatedPlaylist = await storage.updatePlaylist(id, {
        title: title.trim(),
        description: description?.trim() || null,
        isPublic: Boolean(isPublic)
      });

      res.json(updatedPlaylist);
    } catch (error) {
      console.error("Error updating playlist:", error);
      res.status(500).json({ message: "Failed to update playlist" });
    }
  });

  app.delete("/api/playlists/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;

      const playlist = await storage.getPlaylist(id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deletePlaylist(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting playlist:", error);
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });

  app.post("/api/playlists/:id/songs", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      const { songIds } = req.body;

      const playlist = await storage.getPlaylist(id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!Array.isArray(songIds) || songIds.length === 0) {
        return res.status(400).json({ message: "Song IDs array is required" });
      }

      await storage.addSongsToPlaylist(id, songIds);
      res.status(201).json({ message: "Songs added to playlist" });
    } catch (error) {
      console.error("Error adding songs to playlist:", error);
      res.status(500).json({ message: "Failed to add songs to playlist" });
    }
  });

  app.delete("/api/playlists/:id/songs/:songId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id, songId } = req.params;

      const playlist = await storage.getPlaylist(id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      if (playlist.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.removeSongFromPlaylist(id, songId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing song from playlist:", error);
      res.status(500).json({ message: "Failed to remove song from playlist" });
    }
  });

  // Tip routes
  app.post('/api/tips', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const tipData = insertTipSchema.parse({
        fromUserId: userId,
        ...req.body,
      });

      const tip = await storage.createTip(tipData);
      
      // Update user credit balance (subtract tip amount)
      const user = await storage.getUser(userId);
      if (user) {
        const currentBalance = parseFloat(user.creditBalance || '0');
        const tipAmount = parseFloat(tipData.amount);
        const newBalance = Math.max(0, currentBalance - tipAmount);
        await storage.updateUserCredits(userId, newBalance.toFixed(2));
      }

      res.json(tip);
    } catch (error) {
      console.error("Error creating tip:", error);
      res.status(400).json({ message: "Failed to create tip" });
    }
  });

  app.get('/api/tips/sent', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const tips = await storage.getTipsByUser(userId);
      res.json(tips);
    } catch (error) {
      console.error("Error fetching sent tips:", error);
      res.status(500).json({ message: "Failed to fetch sent tips" });
    }
  });

  app.get('/api/tips/received/:artistId', async (req, res) => {
    try {
      const artistId = parseInt(req.params.artistId);
      const tips = await storage.getTipsByArtist(artistId);
      res.json(tips);
    } catch (error) {
      console.error("Error fetching received tips:", error);
      res.status(500).json({ message: "Failed to fetch received tips" });
    }
  });

  // Credit routes
  app.post('/api/credits/purchase', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { amount } = req.body;
      
      // In a real implementation, this would process payment through Stripe
      // For now, we'll just add the credits directly
      const user = await storage.getUser(userId);
      if (user) {
        const currentBalance = parseFloat(user.creditBalance || '0');
        const newBalance = currentBalance + parseFloat(amount);
        await storage.updateUserCredits(userId, newBalance.toFixed(2));
      }

      res.json({ success: true, newBalance: user?.creditBalance });
    } catch (error) {
      console.error("Error purchasing credits:", error);
      res.status(500).json({ message: "Failed to purchase credits" });
    }
  });

  // Playlist routes
  app.post('/api/playlists', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const playlistData = insertPlaylistSchema.parse({
        userId,
        ...req.body,
      });

      const playlist = await storage.createPlaylist(playlistData);
      res.json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(400).json({ message: "Failed to create playlist" });
    }
  });

  app.get('/api/playlists', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const playlists = await storage.getPlaylistsByUser(userId);
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });

  // Artist analytics routes
  app.get('/api/artists/:id/analytics', requireAuth, async (req: any, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      // Verify the artist belongs to this user
      const artist = await storage.getArtistByUserId(userId);
      if (!artist || artist.id !== artistId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const analytics = await storage.getArtistAnalytics(artistId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching artist analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/artists/:id/revenue-breakdown', requireAuth, async (req: any, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      // Verify the artist belongs to this user
      const artist = await storage.getArtistByUserId(userId);
      if (!artist || artist.id !== artistId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const breakdown = await storage.getArtistRevenueBreakdown(artistId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching revenue breakdown:", error);
      res.status(500).json({ message: "Failed to fetch revenue breakdown" });
    }
  });

  // Artist detail routes
  app.get('/api/artists/:id', async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const artist = await storage.getArtistById(artistId);
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      res.json(artist);
    } catch (error) {
      console.error("Error fetching artist:", error);
      res.status(500).json({ message: "Failed to fetch artist" });
    }
  });

  app.get('/api/artists/:id/songs', async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const songs = await storage.getSongsByArtist(artistId);
      
      // Check if each song has lyrics
      const songsWithLyricsStatus = await Promise.all(
        songs.map(async (song) => {
          const lyrics = await storage.getLyricsBySong(song.id);
          return {
            ...song,
            hasLyrics: !!lyrics
          };
        })
      );
      
      res.json(songsWithLyricsStatus);
    } catch (error) {
      console.error("Error fetching artist songs:", error);
      res.status(500).json({ message: "Failed to fetch artist songs" });
    }
  });

  // Manager routes
  app.get('/api/manager/artists', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const artists = await storage.getArtistsByManager(userId);
      res.json(artists);
    } catch (error) {
      console.error("Error fetching managed artists:", error);
      res.status(500).json({ message: "Failed to fetch managed artists" });
    }
  });

  app.post('/api/manager/artists', requireAuth, async (req: any, res) => {
    try {
      const managerId = req.session.userId;
      const { artistId, revenueShare } = req.body;
      
      const managerArtist = await storage.addArtistToManager(managerId, artistId, revenueShare);
      res.json(managerArtist);
    } catch (error) {
      console.error("Error adding artist to manager:", error);
      res.status(400).json({ message: "Failed to add artist to manager" });
    }
  });

  // Get individual artist by ID
  app.get('/api/artists/:id', requireAuth, async (req: any, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const artist = await storage.getArtistById(artistId);
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      res.json(artist);
    } catch (error) {
      console.error("Error fetching artist:", error);
      res.status(500).json({ message: "Failed to fetch artist" });
    }
  });

  // Update artist profile
  app.patch('/api/artists/:id', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
  ]), requireAuth, async (req: any, res) => {
    try {
      const artistId = parseInt(req.params.id);
      
      // Handle file uploads
      let profileImagePath = null;
      let bannerImagePath = null;
      
      if (req.files) {
        if (req.files.profileImage && req.files.profileImage[0]) {
          profileImagePath = `/uploads/${req.files.profileImage[0].filename}`;
        }
        if (req.files.bannerImage && req.files.bannerImage[0]) {
          bannerImagePath = `/uploads/${req.files.bannerImage[0].filename}`;
        }
      }

      const updateData = {
        name: req.body.name,
        bio: req.body.bio || null,
        location: req.body.location || null,
        genre: req.body.genre || null,
        website: req.body.website || null,
        facebookHandle: req.body.facebookHandle || null,
        twitterHandle: req.body.twitterHandle || null,
        instagramHandle: req.body.instagramHandle || null,
        tiktokHandle: req.body.tiktokHandle || null,
        youtubeUrl: req.body.youtubeUrl || null,
        ...(profileImagePath && { profileImageUrl: profileImagePath }),
        ...(bannerImagePath && { bannerImageUrl: bannerImagePath }),
      };

      const updatedArtist = await storage.updateArtist(artistId, updateData);
      res.json(updatedArtist);
    } catch (error) {
      console.error('Error updating artist:', error);
      res.status(500).json({ message: 'Failed to update artist' });
    }
  });

  // Artist Analytics endpoints
  app.get('/api/artists/:id/analytics', requireAuth, async (req: any, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const analytics = await storage.getArtistAnalytics(artistId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching artist analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/artists/:id/revenue-breakdown', requireAuth, async (req: any, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const revenueBreakdown = await storage.getArtistRevenueBreakdown(artistId);
      res.json(revenueBreakdown);
    } catch (error) {
      console.error("Error fetching revenue breakdown:", error);
      res.status(500).json({ message: "Failed to fetch revenue breakdown" });
    }
  });

  app.get('/api/artists/:id/tips', requireAuth, async (req: any, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const tips = await storage.getTipsByArtist(artistId);
      res.json(tips);
    } catch (error) {
      console.error("Error fetching tips:", error);
      res.status(500).json({ message: "Failed to fetch tips" });
    }
  });

  app.post('/api/tips/:id/thank', requireAuth, async (req: any, res) => {
    try {
      const tipId = req.params.id;
      const { reactionType } = req.body;
      
      await storage.addTipReaction(tipId, reactionType);
      res.json({ message: "Thank you sent successfully" });
    } catch (error) {
      console.error("Error sending thank you:", error);
      res.status(500).json({ message: "Failed to send thank you" });
    }
  });

  // Social Features - Artist Following
  app.post('/api/artists/:id/follow', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const artistId = parseInt(req.params.id);
      
      const follow = await storage.followArtist(userId, artistId);
      res.status(201).json(follow);
    } catch (error) {
      console.error("Error following artist:", error);
      res.status(500).json({ message: "Failed to follow artist" });
    }
  });

  app.delete('/api/artists/:id/follow', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const artistId = parseInt(req.params.id);
      
      await storage.unfollowArtist(userId, artistId);
      res.json({ message: "Artist unfollowed successfully" });
    } catch (error) {
      console.error("Error unfollowing artist:", error);
      res.status(500).json({ message: "Failed to unfollow artist" });
    }
  });

  app.get('/api/artists/:id/followers', async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const followers = await storage.getArtistFollowers(artistId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching artist followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/users/:id/following', async (req, res) => {
    try {
      const userId = req.params.id;
      const followedArtists = await storage.getFollowedArtists(userId);
      res.json(followedArtists);
    } catch (error) {
      console.error("Error fetching followed artists:", error);
      res.status(500).json({ message: "Failed to fetch followed artists" });
    }
  });

  app.get('/api/artists/:id/is-following', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const artistId = parseInt(req.params.id);
      
      const isFollowing = await storage.isFollowingArtist(userId, artistId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  // Social Features - Song Comments
  app.post('/api/songs/:id/comments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const songId = req.params.id;
      
      const commentData = insertSongCommentSchema.parse({
        userId,
        songId,
        ...req.body,
      });

      const comment = await storage.addSongComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.get('/api/songs/:id/comments', async (req, res) => {
    try {
      const songId = req.params.id;
      const comments = await storage.getSongComments(songId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.delete('/api/comments/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const commentId = req.params.id;
      
      await storage.deleteSongComment(commentId, userId);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Social Features - Comment Likes
  app.post('/api/comments/:id/like', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const commentId = req.params.id;
      
      const like = await storage.likeSongComment(userId, commentId);
      res.status(201).json(like);
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ message: "Failed to like comment" });
    }
  });

  app.delete('/api/comments/:id/like', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const commentId = req.params.id;
      
      await storage.unlikeSongComment(userId, commentId);
      res.json({ message: "Comment unliked successfully" });
    } catch (error) {
      console.error("Error unliking comment:", error);
      res.status(500).json({ message: "Failed to unlike comment" });
    }
  });

  // Social Features - Song Reviews
  app.post('/api/songs/:id/reviews', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const songId = req.params.id;
      
      const reviewData = insertSongReviewSchema.parse({
        userId,
        songId,
        ...req.body,
      });

      const review = await storage.addSongReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error adding song review:", error);
      res.status(500).json({ message: "Failed to add review" });
    }
  });

  app.get('/api/songs/:id/reviews', async (req, res) => {
    try {
      const songId = req.params.id;
      const reviews = await storage.getSongReviews(songId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching song reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/songs/:id/reviews/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const songId = req.params.id;
      
      const review = await storage.getUserSongReview(userId, songId);
      res.json(review || null);
    } catch (error) {
      console.error("Error fetching user song review:", error);
      res.status(500).json({ message: "Failed to fetch user review" });
    }
  });

  app.put('/api/song-reviews/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const reviewId = req.params.id;
      const { rating, reviewText } = req.body;
      
      const review = await storage.updateSongReview(reviewId, userId, { rating, reviewText });
      res.json(review);
    } catch (error) {
      console.error("Error updating song review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete('/api/song-reviews/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const reviewId = req.params.id;
      
      await storage.deleteSongReview(reviewId, userId);
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting song review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Social Features - Artist Reviews
  app.post('/api/artists/:id/reviews', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const artistId = parseInt(req.params.id);
      
      const reviewData = insertArtistReviewSchema.parse({
        userId,
        artistId,
        ...req.body,
      });

      const review = await storage.addArtistReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error adding artist review:", error);
      res.status(500).json({ message: "Failed to add review" });
    }
  });

  app.get('/api/artists/:id/reviews', async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const reviews = await storage.getArtistReviews(artistId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching artist reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/artists/:id/reviews/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const artistId = parseInt(req.params.id);
      
      const review = await storage.getUserArtistReview(userId, artistId);
      res.json(review || null);
    } catch (error) {
      console.error("Error fetching user artist review:", error);
      res.status(500).json({ message: "Failed to fetch user review" });
    }
  });

  app.put('/api/artist-reviews/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const reviewId = req.params.id;
      const { rating, reviewText } = req.body;
      
      const review = await storage.updateArtistReview(reviewId, userId, { rating, reviewText });
      res.json(review);
    } catch (error) {
      console.error("Error updating artist review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete('/api/artist-reviews/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const reviewId = req.params.id;
      
      await storage.deleteArtistReview(reviewId, userId);
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting artist review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Admin routes - require admin role
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.requireAuth() || req.user?.claims?.sub !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getPlatformAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching platform analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const { accountType, isActive, isSuspended, limit = 50, offset = 0 } = req.query;
      const filters = {
        accountType: accountType as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isSuspended: isSuspended === 'true' ? true : isSuspended === 'false' ? false : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      const result = await storage.getAllUsers(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:id/suspend', requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { reason } = req.body;
      
      await storage.suspendUser(userId, reason);
      res.json({ message: "User suspended successfully" });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.put('/api/admin/users/:id/unsuspend', requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      
      await storage.unsuspendUser(userId);
      res.json({ message: "User unsuspended successfully" });
    } catch (error) {
      console.error("Error unsuspending user:", error);
      res.status(500).json({ message: "Failed to unsuspend user" });
    }
  });

  app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put('/api/admin/users/:id/account-type', requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { accountType } = req.body;
      
      await storage.updateUserAccountType(userId, accountType);
      res.json({ message: "Account type updated successfully" });
    } catch (error) {
      console.error("Error updating account type:", error);
      res.status(500).json({ message: "Failed to update account type" });
    }
  });

  app.get('/api/admin/moderation/queue', requireAdmin, async (req, res) => {
    try {
      const queue = await storage.getContentModerationQueue();
      res.json(queue);
    } catch (error) {
      console.error("Error fetching moderation queue:", error);
      res.status(500).json({ message: "Failed to fetch moderation queue" });
    }
  });

  app.post('/api/admin/moderation/:type/:id/:action', requireAdmin, async (req, res) => {
    try {
      const { type, id, action } = req.params;
      
      await storage.moderateContent(type as 'song' | 'comment' | 'review', id, action as 'approve' | 'reject' | 'remove');
      res.json({ message: "Content moderated successfully" });
    } catch (error) {
      console.error("Error moderating content:", error);
      res.status(500).json({ message: "Failed to moderate content" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Seed database with sample content
  app.post('/api/admin/seed', async (req, res) => {
    try {
      const { seedDatabase } = await import('./seed-data');
      await seedDatabase();
      res.json({ message: 'Database seeded successfully' });
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({ message: 'Failed to seed database' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
