import { storage } from './storage';

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create a sample artist
    const artistUser = await storage.upsertUser({
      id: 'ai_artist_1',
      email: 'ai.artist@aibeats.com',
      firstName: 'Alex',
      lastName: 'Synthesis',
      accountType: 'artist',
      profileImageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      creditBalance: '0.00',
      isActive: true
    });

    const artist = await storage.createArtist({
      userId: artistUser.id,
      name: 'AI Synthesis',
      bio: 'Creating cutting-edge AI-generated music that blends electronic and ambient soundscapes.',
      genre: 'Electronic',
      website: 'https://aisynthesis.music',
      twitterUrl: '@aisynthesis',
      isVerified: true,
      totalStreams: 15420,
      totalRevenue: '245.80',
      monthlyListeners: 3200
    });

    // Create sample songs
    const songs = [
      {
        artistId: artist.id,
        title: 'Neural Dreams',
        description: 'An ethereal journey through AI consciousness, blending ambient textures with electronic beats.',
        fileUrl: 'https://example.com/neural-dreams.mp3',
        coverArtUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop',
        duration: 245,
        aiGenerationMethod: 'fully_ai' as const,
        genres: ['Ambient', 'Electronic'],
        streamCount: 5680,
        revenue: '85.20',
        isPublished: true
      },
      {
        artistId: artist.id,
        title: 'Digital Horizon',
        description: 'Upbeat electronic track showcasing the fusion of human creativity and AI innovation.',
        fileUrl: 'https://example.com/digital-horizon.mp3',
        coverArtUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        duration: 198,
        aiGenerationMethod: 'ai_assisted' as const,
        genres: ['Electronic', 'Dance'],
        streamCount: 4220,
        revenue: '63.30',
        isPublished: true
      },
      {
        artistId: artist.id,
        title: 'Synthetic Emotions',
        description: 'A melodic exploration of how AI interprets and expresses human emotions through sound.',
        fileUrl: 'https://example.com/synthetic-emotions.mp3',
        coverArtUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        duration: 312,
        aiGenerationMethod: 'ai_post_processing' as const,
        genres: ['Ambient', 'Experimental'],
        streamCount: 3840,
        revenue: '57.60',
        isPublished: true
      },
      {
        artistId: artist.id,
        title: 'Code Symphony',
        description: 'A dynamic composition that transforms programming algorithms into musical patterns.',
        fileUrl: 'https://example.com/code-symphony.mp3',
        coverArtUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop',
        duration: 267,
        aiGenerationMethod: 'fully_ai' as const,
        genres: ['Electronic', 'Experimental'],
        streamCount: 1680,
        revenue: '39.70',
        isPublished: true
      }
    ];

    for (const songData of songs) {
      await storage.createSong(songData);
    }

    console.log('Database seeding completed successfully!');
    console.log(`Created artist: ${artist.artistName}`);
    console.log(`Created ${songs.length} songs`);

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}