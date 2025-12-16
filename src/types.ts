import { LovelaceCardConfig } from 'custom-card-helpers';

// API Response types matching the .NET service
export interface RadarResponse {
  frames: RadarFrame[];
  lastUpdated: string;  // ISO 8601 UTC
  observationTime: string;  // ISO 8601 UTC
  forecastTime: string;  // ISO 8601 UTC
  weatherStation?: string;
  distance?: string;
  cacheIsValid: boolean;
  cacheExpiresAt?: string;  // ISO 8601 UTC
  isUpdating: boolean;
  nextUpdateTime?: string;  // ISO 8601 UTC
}

export interface RadarFrame {
  frameIndex: number;
  imageUrl: string;
  minutesAgo: number;
  absoluteObservationTime?: string;  // ISO 8601 UTC
  cacheTimestamp?: string;  // For extended mode
  observationTime?: string;  // For extended mode
  cacheFolderName?: string;  // For extended mode
  sequentialIndex?: number;  // For extended mode
}

export interface RadarTimeSeriesResponse {
  cacheFolders: RadarCacheFolderFrames[];
  startTime?: string;
  endTime?: string;
  totalFrames: number;
}

export interface RadarCacheFolderFrames {
  cacheFolderName: string;
  cacheTimestamp: string;
  observationTime: string;
  frames: RadarFrame[];
}

export interface CacheRangeInfo {
  totalCacheFolders: number;
  timeSpanMinutes?: number;
  oldestCache: {
    cacheTimestamp: string;
  };
  newestCache: {
    cacheTimestamp: string;
  };
}

// Card configuration
export interface BomLocalRadarCardConfig extends LovelaceCardConfig {
  type: 'custom:bom-local-radar-card';
  
  // Service configuration
  service_url?: string;  // Base URL of bom-local-service (e.g., "http://localhost:8082")
  suburb: string;  // Required: suburb name (e.g., "Pomona")
  state: string;  // Required: state abbreviation (e.g., "QLD")
  
  // Display
  card_title?: string;
  show_timestamp?: boolean;
  show_metadata?: boolean;
  
  // Slideshow configuration
  timespan?: 'latest' | '1h' | '3h' | '6h' | '12h' | '24h' | 'custom';  // Historical data timespan
  frame_interval?: number;  // Seconds between frames (default: 2.0)
  auto_play?: boolean;  // Auto-start animation (default: true)
  
  // Auto-refresh
  refresh_interval?: number;  // Seconds between API refreshes (default: 30)
  
  // Custom time range (for timespan: 'custom')
  custom_start_time?: string;  // ISO 8601 datetime
  custom_end_time?: string;  // ISO 8601 datetime
}











