import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSongSchema, insertTipSchema, insertPlaylistSchema, insertArtistSchema } from "@shared/schema";
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
    if (file.fieldname === 'audio') {
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid audio file type'));
      }
    } else if (file.fieldname === 'artwork') {
      const allowedTypes = ['image/jpeg', 'image/png'];
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.post('/api/user/update-profile', isAuthenticated, upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'headerImage', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, bio, location } = req.body;
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const profileImageFile = files.profileImage?.[0];
      const headerImageFile = files.headerImage?.[0];

      // Update user profile
      await storage.upsertUser({
        id: userId,
        email: req.user.claims.email,
        firstName,
        lastName,
        profileImageUrl: profileImageFile ? `/uploads/${profileImageFile.filename}` : req.user.claims.profile_image_url,
        accountType: req.body.accountType || 'listener',
      });

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/user/setup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { accountType, name, bio, location } = req.body;

      // Update user account type
      await storage.upsertUser({
        id: userId,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        accountType,
      });

      // If artist or manager, create artist profile
      if (accountType === 'artist' || accountType === 'manager') {
        const artistData = insertArtistSchema.parse({
          userId,
          name: name || `${req.user.claims.first_name || ''} ${req.user.claims.last_name || ''}`.trim(),
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
  app.get('/api/artist/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Song routes
  app.post('/api/songs/upload', isAuthenticated, upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'artwork', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const artist = await storage.getArtistByUserId(userId);
      
      if (!artist) {
        return res.status(404).json({ message: "Artist profile not found" });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const audioFile = files.audio?.[0];
      const artworkFile = files.artwork?.[0];

      if (!audioFile) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      const songData = insertSongSchema.parse({
        artistId: artist.id,
        title: req.body.title,
        description: req.body.description,
        fileUrl: `/uploads/${audioFile.filename}`,
        coverArtUrl: artworkFile ? `/uploads/${artworkFile.filename}` : null,
        aiGenerationMethod: req.body.aiGenerationMethod,
        isPublished: true,
      });

      const song = await storage.createSong(songData);
      res.json(song);
    } catch (error) {
      console.error("Error uploading song:", error);
      res.status(400).json({ message: "Failed to upload song" });
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

  app.get('/api/songs/trending', async (req, res) => {
    try {
      const songs = await storage.getTrendingSongs();
      res.json(songs);
    } catch (error) {
      console.error("Error fetching trending songs:", error);
      res.status(500).json({ message: "Failed to fetch trending songs" });
    }
  });

  app.get('/api/songs/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/streams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/streams/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streams = await storage.getStreamsByUser(userId);
      res.json(streams);
    } catch (error) {
      console.error("Error fetching stream history:", error);
      res.status(500).json({ message: "Failed to fetch stream history" });
    }
  });

  // Tip routes
  app.post('/api/tips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/tips/sent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/credits/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playlists = await storage.getPlaylistsByUser(userId);
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });

  // Manager routes
  app.get('/api/manager/artists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const artists = await storage.getArtistsByManager(userId);
      res.json(artists);
    } catch (error) {
      console.error("Error fetching managed artists:", error);
      res.status(500).json({ message: "Failed to fetch managed artists" });
    }
  });

  app.post('/api/manager/artists', isAuthenticated, async (req: any, res) => {
    try {
      const managerId = req.user.claims.sub;
      const { artistId, revenueShare } = req.body;
      
      const managerArtist = await storage.addArtistToManager(managerId, artistId, revenueShare);
      res.json(managerArtist);
    } catch (error) {
      console.error("Error adding artist to manager:", error);
      res.status(400).json({ message: "Failed to add artist to manager" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
