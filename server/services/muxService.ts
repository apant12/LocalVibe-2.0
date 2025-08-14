// Mux video streaming service
export class MuxService {
  private tokenId: string;
  private tokenSecret: string;
  private baseUrl = 'https://api.mux.com';

  constructor() {
    this.tokenId = process.env.MUX_TOKEN_ID || '';
    this.tokenSecret = process.env.MUX_TOKEN_SECRET || '';
  }

  isConfigured(): boolean {
    return !!(this.tokenId && this.tokenSecret);
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.tokenId}:${this.tokenSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  // Create a new asset from a URL
  async createAsset(params: {
    input: string; // URL to video file
    playbackPolicy?: 'public' | 'signed';
    mp4Support?: 'standard' | 'high' | 'none';
    normalizeAudio?: boolean;
  }) {
    if (!this.isConfigured()) {
      throw new Error('Mux tokens not configured');
    }

    const response = await fetch(`${this.baseUrl}/video/v1/assets`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: params.input,
        playback_policy: [params.playbackPolicy || 'public'],
        mp4_support: params.mp4Support || 'standard',
        normalize_audio: params.normalizeAudio !== false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mux API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // Get asset details
  async getAsset(assetId: string) {
    if (!this.isConfigured()) {
      throw new Error('Mux tokens not configured');
    }

    const response = await fetch(`${this.baseUrl}/video/v1/assets/${assetId}`, {
      headers: {
        'Authorization': this.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mux API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // Create a direct upload for user-generated content
  async createDirectUpload(params: {
    corsOrigin?: string;
    newAssetSettings?: {
      playbackPolicy?: 'public' | 'signed';
      mp4Support?: 'standard' | 'high' | 'none';
    };
  } = {}) {
    if (!this.isConfigured()) {
      throw new Error('Mux tokens not configured');
    }

    const response = await fetch(`${this.baseUrl}/video/v1/uploads`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cors_origin: params.corsOrigin,
        new_asset_settings: params.newAssetSettings || {
          playback_policy: ['public']
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mux API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // Get upload details
  async getUpload(uploadId: string) {
    if (!this.isConfigured()) {
      throw new Error('Mux tokens not configured');
    }

    const response = await fetch(`${this.baseUrl}/video/v1/uploads/${uploadId}`, {
      headers: {
        'Authorization': this.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mux API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // Generate a signed URL for private videos
  async signUrl(playbackId: string, params: {
    keyId?: string;
    keySecret?: string;
    expiration?: number; // seconds from now
  } = {}) {
    if (!this.isConfigured()) {
      throw new Error('Mux tokens not configured');
    }

    // For signed URLs, you'd typically use a separate signing key
    // This is a simplified version - in production, implement proper JWT signing
    const expiration = params.expiration || 3600; // 1 hour default
    const exp = Math.floor(Date.now() / 1000) + expiration;

    return {
      playbackId,
      signedUrl: `https://stream.mux.com/${playbackId}.m3u8`,
      expiration: exp
    };
  }
}