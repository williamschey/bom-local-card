import { LitElement, html, css, type CSSResultGroup, type TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor, LovelaceCard } from 'custom-card-helpers';
import './editor';
import { BomLocalRadarCardConfig, RadarResponse, RadarFrame, RadarTimeSeriesResponse } from './types';
import { CARD_VERSION, DEFAULT_SERVICE_URL, DEFAULT_FRAME_INTERVAL, DEFAULT_REFRESH_INTERVAL, DEFAULT_RESTART_DELAY } from './const';

console.info(
  `%c  BOM-LOCAL-RADAR-CARD  \n%c  Version ${CARD_VERSION}   `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

type LovelaceCustomCard = {
  type: string;
  name: string;
  preview?: boolean;
  description?: string;
};

declare global {
  interface Window {
    customCards?: LovelaceCustomCard[];
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: 'bom-local-radar-card',
  name: 'BOM Local Radar Card',
  description: 'A rain radar card using the local BOM service',
});

@customElement('bom-local-radar-card')
export class BomLocalRadarCard extends LitElement implements LovelaceCard {
  static override styles: CSSResultGroup = css`
    #card {
      overflow: hidden;
    }
    #root {
      width: 100%;
      position: relative;
    }
    .radar-image-container {
      position: relative;
      width: 100%;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 15px;
      aspect-ratio: 16/9;
      min-height: 250px;
    }
    .radar-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      image-rendering: crisp-edges;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 1.2em;
    }
    .frame-slider-container {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-radius: 12px;
      border: 2px solid #e0e0e0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      margin-bottom: 15px;
      box-sizing: border-box;
    }
    .frame-slider-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .frame-nav-btn {
      padding: 10px 16px;
      border: 2px solid var(--primary-color, #667eea);
      background: white;
      color: var(--primary-color, #667eea);
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.9em;
      transition: all 0.2s;
      min-width: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .frame-nav-btn:hover:not(:disabled) {
      background: var(--primary-color, #667eea);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .frame-nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: #f0f0f0;
      border-color: #d0d0d0;
      color: #999;
    }
    .frame-slider {
      flex: 1;
      min-width: 120px;
      height: 10px;
      border-radius: 5px;
      background: #e0e0e0;
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
      order: 3;
    }
    .frame-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
      border: 3px solid white;
      transition: all 0.2s;
    }
    .frame-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.6);
    }
    .frame-slider::-webkit-slider-runnable-track {
      height: 10px;
      border-radius: 5px;
      background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
    }
    .frame-slider::-moz-range-thumb {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      cursor: pointer;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
    }
    .frame-slider::-moz-range-track {
      height: 10px;
      border-radius: 5px;
      background: #e0e0e0;
    }
    .frame-slider::-moz-range-progress {
      height: 10px;
      border-radius: 5px;
      background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
    }
    .play-controls {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    .play-btn {
      padding: 12px 20px;
      border: none;
      background: var(--primary-color, #667eea);
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9em;
      transition: all 0.2s;
      min-height: 44px;
    }
    .play-btn:hover:not(:disabled) {
      background: var(--primary-color-dark, #5568d3);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .play-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .frame-info {
      text-align: center;
      color: var(--secondary-text-color, #666);
      font-size: 0.9em;
      margin-top: 10px;
    }
    .info-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }
    .info-card {
      background: var(--card-background-color, white);
      border-radius: 8px;
      padding: 15px;
      border-left: 4px solid var(--primary-color, #667eea);
    }
    .info-card h3 {
      font-size: 0.8em;
      text-transform: uppercase;
      color: var(--secondary-text-color, #666);
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .info-card .value {
      font-size: 1.2em;
      font-weight: 600;
      color: var(--primary-text-color, #333);
    }
    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 15px;
      border-radius: 8px;
      margin: 20px;
      border-left: 4px solid #dc3545;
    }
    #card-title {
      margin: 8px 0px 4px 8px;
      font-size: 1.5em;
    }
    @media (min-width: 480px) {
      .frame-slider-wrapper {
        flex-wrap: nowrap;
      }
      .frame-slider {
        order: 0;
      }
    }
  `;

  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) private _config!: BomLocalRadarCardConfig;
  @property({ attribute: false }) public editMode?: boolean;

  @state() private radarData?: RadarResponse;
  @state() private currentFrameIndex = 0;
  @state() private isLoading = false;
  @state() private error?: string;
  @state() private animationTimer?: NodeJS.Timeout;
  @state() private refreshTimer?: NodeJS.Timeout;
  @state() private retryTimer?: NodeJS.Timeout;
  @state() private isPlaying = false;
  @state() private frames: RadarFrame[] = [];
  @state() private isExtendedMode = false;
  private preloadedImages: HTMLImageElement[] = [];

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('bom-local-radar-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): Record<string, unknown> {
    return {
      type: 'custom:bom-local-radar-card',
      suburb: 'Pomona',
      state: 'QLD',
      service_url: 'http://localhost:8082',
    };
  }

  public setConfig(config: BomLocalRadarCardConfig): void {
    if (!config.suburb || !config.state) {
      throw new Error('suburb and state are required');
    }
    this._config = config;
  }

  getCardSize(): number {
    return 10;
  }

  /**
   * Resolves a URL relative to the service URL if it's a relative path
   * Service returns relative URLs like "/api/radar/.../frame/..." which need
   * to be resolved against the service_url base
   */
  private resolveImageUrl(url: string, serviceUrl: string): string {
    if (!url) return url;
    // If URL is already absolute (starts with http:// or https://), use as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If URL is relative (starts with /), resolve against service URL
    if (url.startsWith('/')) {
      // Remove trailing slash from serviceUrl if present
      const baseUrl = serviceUrl.replace(/\/$/, '');
      return `${baseUrl}${url}`;
    }
    // If URL is relative without leading slash, resolve against service URL with path
    const baseUrl = serviceUrl.replace(/\/$/, '');
    return `${baseUrl}/${url}`;
  }

  /**
   * Fetches radar data from the local service
   * Supports both latest frames and historical timeseries
   */
  private async fetchRadarData(): Promise<RadarResponse | null> {
    const serviceUrl = this._config.service_url || DEFAULT_SERVICE_URL;
    const suburb = encodeURIComponent(this._config.suburb);
    const state = encodeURIComponent(this._config.state);
    
    try {
      this.isLoading = true;
      this.error = undefined;

      // Check if we're in extended mode (historical data)
      const timespan = this._config.timespan || 'latest';
      
      if (timespan !== 'latest') {
        // Fetch historical data via timeseries endpoint
        return await this.fetchHistoricalRadar(serviceUrl, suburb, state, timespan);
      } else {
        // Fetch latest frames
        const url = `${serviceUrl}/api/radar/${suburb}/${state}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.retryAfter) {
              this.error = `Cache not ready. Retry in ${errorData.retryAfter} seconds.`;
              // Clear any existing retry timer
              if (this.retryTimer) {
                clearTimeout(this.retryTimer);
              }
              this.retryTimer = setTimeout(() => {
                this.retryTimer = undefined;
                this.fetchRadarData();
              }, errorData.retryAfter * 1000);
              return null;
            }
            throw new Error('Radar data not found. Cache may be updating.');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: any = await response.json();
        
        // Check if response contains an error (cache not ready, etc.)
        if (data.error) {
          if (data.retryAfter) {
            this.error = `Cache not ready. Retry in ${data.retryAfter} seconds.`;
            // Clear any existing retry timer
            if (this.retryTimer) {
              clearTimeout(this.retryTimer);
            }
            this.retryTimer = setTimeout(() => {
              this.retryTimer = undefined;
              this.fetchRadarData();
            }, data.retryAfter * 1000);
            return null;
          }
          throw new Error(data.error || 'Service returned an error');
        }
        
        // Validate response has frames
        if (!data.frames || data.frames.length === 0) {
          throw new Error('No frames available in response');
        }

        // Resolve relative image URLs against service URL
        // Service returns relative URLs like "/api/radar/.../frame/..." 
        // which need to be absolute for browser to fetch from correct origin
        data.frames.forEach((frame: RadarFrame) => {
          if (frame.imageUrl) {
            frame.imageUrl = this.resolveImageUrl(frame.imageUrl, serviceUrl);
          }
        });

        this.radarData = data;
        this.frames = data.frames.sort((a, b) => a.frameIndex - b.frameIndex);
        this.isExtendedMode = false;
        this.isLoading = false;
        
        // Preload images
        this.preloadImages(this.frames);
        
        // Start animation if auto-play is enabled and not already playing
        // Only restart if frames changed or we're not playing
        if (this._config.auto_play !== false && !this.isPlaying) {
          this.startAnimation();
        }

        return data;
      }
    } catch (err) {
      this.isLoading = false;
      this.error = err instanceof Error ? err.message : 'Failed to fetch radar data';
      console.error('Error fetching radar data:', err);
      return null;
    }
  }

  /**
   * Fetches historical radar data for extended timespan
   */
  private async fetchHistoricalRadar(
    serviceUrl: string,
    suburb: string,
    state: string,
    timespan: string
  ): Promise<RadarResponse | null> {
    try {
      let startTime: Date | null = null;
      let endTime = new Date();

      if (timespan === 'custom') {
        if (this._config.custom_start_time) {
          startTime = new Date(this._config.custom_start_time);
        }
        if (this._config.custom_end_time) {
          endTime = new Date(this._config.custom_end_time);
        }
      } else {
        // Calculate hours back from now
        const hours = parseInt(timespan.replace('h', '')) || 1;
        startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
      }

      if (!startTime) {
        throw new Error('Invalid timespan configuration');
      }

      const url = `${serviceUrl}/api/radar/${suburb}/${state}/timeseries?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RadarTimeSeriesResponse = await response.json();
      
      if (!data.cacheFolders || data.cacheFolders.length === 0) {
        throw new Error('No historical data found for the specified time range.');
      }

      // Flatten all frames from all cache folders
      const allFrames: RadarFrame[] = [];
      data.cacheFolders.forEach(cacheFolder => {
        cacheFolder.frames.forEach(frame => {
          frame.cacheTimestamp = cacheFolder.cacheTimestamp;
          frame.observationTime = cacheFolder.observationTime;
          frame.cacheFolderName = cacheFolder.cacheFolderName;
          // Resolve relative image URLs against service URL
          if (frame.imageUrl) {
            frame.imageUrl = this.resolveImageUrl(frame.imageUrl, serviceUrl);
          }
          allFrames.push(frame);
        });
      });

      // Re-index frames sequentially
      allFrames.forEach((frame, idx) => {
        frame.sequentialIndex = idx;
      });

      // Fetch latest metadata for display
      let metadata: Partial<RadarResponse> = {};
      try {
        const metadataUrl = `${serviceUrl}/api/radar/${suburb}/${state}/metadata`;
        const metadataResponse = await fetch(metadataUrl);
        if (metadataResponse.ok) {
          metadata = await metadataResponse.json();
        }
      } catch (err) {
        console.debug('Could not fetch metadata:', err);
      }

      // Create RadarResponse-like object
      const newestCacheFolder = data.cacheFolders[data.cacheFolders.length - 1];
      const radarResponse: RadarResponse = {
        frames: allFrames,
        lastUpdated: endTime.toISOString(),
        observationTime: metadata.observationTime || newestCacheFolder?.observationTime || endTime.toISOString(),
        forecastTime: endTime.toISOString(),
        weatherStation: metadata.weatherStation,
        distance: metadata.distance,
        cacheIsValid: metadata.cacheIsValid ?? true,
        cacheExpiresAt: metadata.cacheExpiresAt || endTime.toISOString(),
        isUpdating: metadata.isUpdating || false,
        nextUpdateTime: metadata.nextUpdateTime || endTime.toISOString(),
      };

      this.radarData = radarResponse;
      this.frames = allFrames;
      this.isExtendedMode = true;
      this.isLoading = false;

      // Preload images
      this.preloadImages(this.frames);

      // Start animation if auto-play is enabled and not already playing
      // Only restart if frames changed or we're not playing
      if (this._config.auto_play !== false && !this.isPlaying) {
        this.startAnimation();
      }

      return radarResponse;
    } catch (err) {
      this.isLoading = false;
      this.error = err instanceof Error ? err.message : 'Failed to fetch historical radar data';
      console.error('Error fetching historical radar data:', err);
      return null;
    }
  }

  /**
   * Gets the current frame image URL
   */
  private getCurrentFrameUrl(): string | null {
    if (!this.frames || this.frames.length === 0) {
      return null;
    }
    const frame = this.frames[this.currentFrameIndex];
    return frame?.imageUrl || null;
  }

  /**
   * Formats timestamp for display
   */
  private formatTimestamp(isoString: string): string {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('en-AU', {
      timeZone: 'Australia/Brisbane',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Preloads all frame images to prevent jiggle when switching
   * Cleans up old preloaded images to prevent memory leaks
   */
  private preloadImages(frames: RadarFrame[]): void {
    // Clean up old preloaded images
    this.preloadedImages.forEach(img => {
      img.src = '';
      img.onload = null;
      img.onerror = null;
    });
    this.preloadedImages = [];

    // Preload new images
    frames.forEach(frame => {
      const img = new Image();
      img.src = frame.imageUrl;
      this.preloadedImages.push(img);
    });
  }

  /**
   * Starts the frame animation loop
   * Ensures only one animation timer is active at a time
   */
  private startAnimation(): void {
    // Always stop existing animation first to prevent accumulation
    this.stopAnimation();

    if (this.frames.length === 0) {
      return;
    }

    this.isPlaying = true;
    const frameInterval = (this._config.frame_interval || DEFAULT_FRAME_INTERVAL) * 1000;
    const restartDelay = DEFAULT_RESTART_DELAY;
    const maxFrame = this.frames.length - 1;

    // Use a single consistent timer approach (setTimeout chain, not setInterval)
    // This prevents timer accumulation and makes cleanup easier
    const animate = () => {
      // Check if we're still playing (might have been stopped)
      if (!this.isPlaying) {
        return;
      }

      // Check if animation was cleared (component disconnected)
      if (!this.animationTimer) {
        return;
      }

      if (this.currentFrameIndex >= maxFrame) {
        // Pause before restarting
        this.animationTimer = setTimeout(() => {
          if (!this.isPlaying) return;
          this.currentFrameIndex = 0;
          this.requestUpdate();
          this.animationTimer = setTimeout(animate, frameInterval);
        }, restartDelay);
      } else {
        this.currentFrameIndex++;
        this.requestUpdate();
        this.animationTimer = setTimeout(animate, frameInterval);
      }
    };

    // Start immediately
    this.animationTimer = setTimeout(animate, 0);
  }

  /**
   * Stops the animation
   */
  private stopAnimation(): void {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      clearTimeout(this.animationTimer);
      this.animationTimer = undefined;
    }
    this.isPlaying = false;
  }

  /**
   * Toggles play/pause
   */
  private toggleAnimation(): void {
    if (this.isPlaying) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  /**
   * Shows a specific frame
   */
  private showFrame(index: number): void {
    if (index < 0 || index >= this.frames.length) {
      return;
    }
    this.currentFrameIndex = index;
    this.requestUpdate();
  }

  /**
   * Navigate to previous frame
   */
  private previousFrame(): void {
    this.stopAnimation();
    const newIndex = this.currentFrameIndex > 0 ? this.currentFrameIndex - 1 : this.frames.length - 1;
    this.showFrame(newIndex);
  }

  /**
   * Navigate to next frame
   */
  private nextFrame(): void {
    this.stopAnimation();
    const newIndex = (this.currentFrameIndex + 1) % this.frames.length;
    this.showFrame(newIndex);
  }

  /**
   * Jump forward/backward by N frames
   */
  private jumpFrame(offset: number): void {
    const newIndex = Math.max(0, Math.min(this.frames.length - 1, this.currentFrameIndex + offset));
    this.showFrame(newIndex);
  }

  /**
   * Auto-refresh data
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    const refreshInterval = (this._config.refresh_interval || DEFAULT_REFRESH_INTERVAL) * 1000;
    this.refreshTimer = setInterval(() => {
      this.fetchRadarData();
    }, refreshInterval);
  }

  /**
   * Stops auto-refresh
   */
  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  async firstUpdated(): Promise<void> {
    await this.fetchRadarData();
    this.startAutoRefresh();
  }

  public override connectedCallback(): void {
    super.connectedCallback();
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopAnimation();
    this.stopAutoRefresh();
    
    // Clean up retry timer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    
    // Clean up preloaded images
    this.preloadedImages.forEach(img => {
      img.src = '';
      img.onload = null;
      img.onerror = null;
    });
    this.preloadedImages = [];
  }

  protected override updated(changedProperties: Map<string | number | symbol, unknown>): void {
    super.updated(changedProperties);
    
    // Handle config changes
    if (changedProperties.has('_config')) {
      const oldConfig = changedProperties.get('_config') as BomLocalRadarCardConfig | undefined;
      if (oldConfig && this._config) {
        // If location or timespan changed, refetch data
        if (oldConfig.suburb !== this._config.suburb || 
            oldConfig.state !== this._config.state ||
            oldConfig.timespan !== this._config.timespan ||
            oldConfig.custom_start_time !== this._config.custom_start_time ||
            oldConfig.custom_end_time !== this._config.custom_end_time) {
          this.fetchRadarData();
        }
        // If service URL changed, refetch
        if (oldConfig.service_url !== this._config.service_url) {
          this.fetchRadarData();
        }
        // If refresh interval changed, restart auto-refresh
        if (oldConfig.refresh_interval !== this._config.refresh_interval) {
          this.startAutoRefresh();
        }
        // If frame interval changed and playing, restart animation
        if (oldConfig.frame_interval !== this._config.frame_interval && this.isPlaying) {
          this.stopAnimation();
          this.startAnimation();
        }
      }
    }
  }

  protected override render(): TemplateResult {
    if (!this._config) {
      return html`<hui-warning>Configuration error</hui-warning>`;
    }

    const cardTitle = this._config.card_title 
      ? html`<div id="card-title">${this._config.card_title}</div>` 
      : '';

    if (this.error) {
      return html`
        <ha-card id="card">
          ${cardTitle}
          <div class="error">${this.error}</div>
        </ha-card>
      `;
    }

    const currentFrameUrl = this.getCurrentFrameUrl();
    const currentFrame = this.frames[this.currentFrameIndex];
    
    // Format frame info
    let frameInfoText = '';
    if (currentFrame) {
      if (this.isExtendedMode && currentFrame.absoluteObservationTime) {
        frameInfoText = `Frame ${currentFrame.sequentialIndex ?? this.currentFrameIndex} of ${this.frames.length - 1} • ${this.formatTimestamp(currentFrame.absoluteObservationTime)}`;
      } else {
        frameInfoText = `Frame ${currentFrame.frameIndex} of ${this.frames.length - 1} • ${currentFrame.minutesAgo} minutes ago`;
      }
    }

    const progress = this.frames.length > 0 
      ? Math.round(((this.currentFrameIndex + 1) / this.frames.length) * 100) 
      : 0;

    return html`
      <ha-card id="card">
        ${cardTitle}
        <div id="root">
          ${this._config.show_metadata !== false ? html`
            <div class="info-section">
              <div class="info-card">
                <h3>Cache Status</h3>
                <div class="value">
                  ${this.radarData?.isUpdating ? 'Updating' : 
                    this.radarData?.cacheIsValid ? 'Valid' : 'Invalid'}
                </div>
              </div>
              <div class="info-card">
                <h3>Observation Time</h3>
                <div class="value">${this.radarData?.observationTime ? this.formatTimestamp(this.radarData.observationTime) : '-'}</div>
              </div>
              <div class="info-card">
                <h3>Weather Station</h3>
                <div class="value">${this.radarData?.weatherStation || '-'}</div>
              </div>
            </div>
          ` : ''}
          
          <div class="radar-image-container">
            ${this.isLoading 
              ? html`<div class="loading">Loading radar data...</div>`
              : currentFrameUrl 
                ? html`
                    <img 
                      class="radar-image"
                      src="${currentFrameUrl}" 
                      alt="Radar frame ${this.currentFrameIndex}"
                      @error="${() => { this.error = 'Failed to load radar image'; }}"
                    />
                  `
                : ''
            }
          </div>
          
          ${this.frames.length > 0 ? html`
            <div class="frame-slider-container">
              <div class="frame-slider-wrapper">
                <button 
                  class="frame-nav-btn" 
                  @click="${() => this.showFrame(0)}"
                  ?disabled="${this.currentFrameIndex === 0}"
                  title="First frame"
                >⏮</button>
                <button 
                  class="frame-nav-btn" 
                  @click="${() => this.jumpFrame(-10)}"
                  ?disabled="${this.currentFrameIndex === 0}"
                  title="Go back 10 frames"
                >-10</button>
                <input 
                  type="range" 
                  class="frame-slider" 
                  min="0" 
                  max="${this.frames.length - 1}" 
                  .value="${this.currentFrameIndex}"
                  @input="${(e: Event) => this.showFrame(parseInt((e.target as HTMLInputElement).value))}"
                />
                <button 
                  class="frame-nav-btn" 
                  @click="${() => this.jumpFrame(10)}"
                  ?disabled="${this.currentFrameIndex >= this.frames.length - 1}"
                  title="Go forward 10 frames"
                >+10</button>
                <button 
                  class="frame-nav-btn" 
                  @click="${() => this.showFrame(this.frames.length - 1)}"
                  ?disabled="${this.currentFrameIndex >= this.frames.length - 1}"
                  title="Last frame"
                >⏭</button>
              </div>
              <div class="frame-info">
                ${frameInfoText} • Progress: ${progress}%
              </div>
            </div>
            
            <div class="play-controls">
              <button 
                class="play-btn" 
                @click="${() => this.toggleAnimation()}"
              >${this.isPlaying ? '⏸ Pause' : '▶ Play'}</button>
              <button 
                class="play-btn" 
                @click="${() => this.previousFrame()}"
              >◀ Previous</button>
              <button 
                class="play-btn" 
                @click="${() => this.nextFrame()}"
              >Next ▶</button>
            </div>
          ` : ''}
        </div>
      </ha-card>
    `;
  }
}

if (!customElements.get('bom-local-radar-card')) {
  customElements.define('bom-local-radar-card', BomLocalRadarCard);
}









