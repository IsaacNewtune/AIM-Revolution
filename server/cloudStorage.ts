import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Bitrate configurations for subscription tiers
export const BITRATE_CONFIG = {
  free: 128,      // 128kbps for free tier
  premium: 192,   // 192kbps for premium tier  
  vip: 320       // 320kbps for VIP tier
};

// S3 and CloudFront configuration
class CloudStorageService {
  private s3Client: S3Client | null = null;
  private cloudFrontClient: CloudFrontClient | null = null;
  private bucketName: string;
  private distributionId: string;
  private region: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
    this.distributionId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID || '';
    this.region = process.env.AWS_REGION || 'us-east-1';

    // Initialize AWS clients if credentials are available
    if (this.hasAWSCredentials()) {
      this.initializeAWSClients();
    }
  }

  private hasAWSCredentials(): boolean {
    return !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET_NAME
    );
  }

  private initializeAWSClients() {
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.cloudFrontClient = new CloudFrontClient({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  // Generate S3 key with bitrate organization
  private generateS3Key(songId: string, bitrate: number, originalName: string): string {
    const extension = originalName.split('.').pop();
    return `music/${bitrate}kbps/${songId}.${extension}`;
  }

  // Upload music file to S3 with multiple bitrates
  async uploadMusicFile(
    file: Express.Multer.File,
    songId: string,
    bitrates: number[] = [128, 192, 320]
  ): Promise<{ [bitrate: number]: string }> {
    if (!this.s3Client) {
      throw new Error('AWS S3 not configured. Please provide AWS credentials.');
    }

    const uploadResults: { [bitrate: number]: string } = {};

    for (const bitrate of bitrates) {
      const key = this.generateS3Key(songId, bitrate, file.originalname);
      
      // In a real implementation, you would transcode the audio to different bitrates here
      // For now, we'll upload the original file for each bitrate
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          songId,
          bitrate: bitrate.toString(),
          originalName: file.originalname,
        },
      });

      await this.s3Client.send(command);
      
      // Generate CloudFront URL if distribution is configured
      const url = this.distributionId 
        ? `https://${this.distributionId}.cloudfront.net/${key}`
        : `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      
      uploadResults[bitrate] = url;
    }

    return uploadResults;
  }

  // Get appropriate music URL based on user subscription tier
  getStreamingUrl(songUrls: { [bitrate: number]: string }, userTier: string): string {
    const requiredBitrate = BITRATE_CONFIG[userTier as keyof typeof BITRATE_CONFIG] || 128;
    
    // Return the exact bitrate if available, otherwise fallback to lower quality
    if (songUrls[requiredBitrate]) {
      return songUrls[requiredBitrate];
    }

    // Fallback logic: find the highest available bitrate that's <= required
    const availableBitrates = Object.keys(songUrls).map(Number).sort((a, b) => b - a);
    for (const bitrate of availableBitrates) {
      if (bitrate <= requiredBitrate) {
        return songUrls[bitrate];
      }
    }

    // Last resort: return lowest available bitrate
    const lowestBitrate = Math.min(...availableBitrates);
    return songUrls[lowestBitrate];
  }

  // Generate presigned URL for secure uploads
  async getPresignedUploadUrl(songId: string, filename: string, bitrate: number): Promise<string> {
    if (!this.s3Client) {
      throw new Error('AWS S3 not configured. Please provide AWS credentials.');
    }

    const key = this.generateS3Key(songId, bitrate, filename);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
  }

  // Delete music file from S3
  async deleteMusicFile(songId: string, bitrates: number[] = [128, 192, 320]): Promise<void> {
    if (!this.s3Client) {
      throw new Error('AWS S3 not configured. Please provide AWS credentials.');
    }

    for (const bitrate of bitrates) {
      const key = this.generateS3Key(songId, bitrate, `${songId}.mp3`); // Assuming mp3 format
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    }

    // Invalidate CloudFront cache
    if (this.cloudFrontClient && this.distributionId) {
      await this.invalidateCloudFrontCache(songId);
    }
  }

  // Invalidate CloudFront cache for song files
  private async invalidateCloudFrontCache(songId: string): Promise<void> {
    if (!this.cloudFrontClient || !this.distributionId) return;

    const paths = [128, 192, 320].map(bitrate => 
      `/music/${bitrate}kbps/${songId}.*`
    );

    const command = new CreateInvalidationCommand({
      DistributionId: this.distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
        CallerReference: `${songId}-${Date.now()}`,
      },
    });

    await this.cloudFrontClient.send(command);
  }

  // Check if cloud storage is available
  isAvailable(): boolean {
    return this.hasAWSCredentials() && !!this.s3Client;
  }

  // Get storage statistics
  async getStorageStats(): Promise<{ totalFiles: number; totalSize: number } | null> {
    if (!this.s3Client) return null;

    // This would require additional S3 API calls to list objects and calculate sizes
    // Implementation depends on specific requirements
    return { totalFiles: 0, totalSize: 0 };
  }
}

// Multer configuration for file uploads
export const uploadConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/flac',
      'audio/aac',
      'audio/ogg',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

export const cloudStorage = new CloudStorageService();