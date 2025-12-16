import { LitElement, html, css, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor, fireEvent } from 'custom-card-helpers';
import type { TemplateResult } from 'lit';
import { BomLocalRadarCardConfig, MetadataDisplayConfig, ControlsDisplayConfig } from './types';

// Australian states for dropdown
const AUSTRALIAN_STATES = [
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'WA', label: 'Western Australia' },
];

@customElement('bom-local-radar-card-editor')
export class BomLocalRadarCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: BomLocalRadarCardConfig = this._mergeWithDefaults();
  @state() private _metadataExpanded = false;
  @state() private _controlsExpanded = false;

  private _mergeWithDefaults(config: Partial<BomLocalRadarCardConfig> = {}): BomLocalRadarCardConfig {
    const defaults: Partial<BomLocalRadarCardConfig> = {
      service_url: 'http://localhost:8082',
      timespan: 'latest',
      frame_interval: 2.0,
      refresh_interval: 30,
      auto_play: true,
      show_card_title: true,
      show_metadata: true,
      show_controls: true,
      image_zoom: 1.0,
      image_fit: 'contain',
      overlay_opacity: 0.9,
    };

    return {
      ...defaults,
      ...config,
      type: 'custom:bom-local-radar-card',
    } as BomLocalRadarCardConfig;
  }

  public setConfig(config: BomLocalRadarCardConfig): void {
    this._config = this._mergeWithDefaults(config);
    this.requestUpdate();
  }

  protected render(): TemplateResult {
    if (!this.hass) return html``;

    return html`
      <div class="editor">
        <div class="section">
          <h3>Service Configuration</h3>
          <ha-textfield
            label="Service URL"
            .value=${this._config.service_url || ''}
            @input=${(e: Event) => this._updateConfig('service_url', (e.target as HTMLInputElement).value)}
            helper="Base URL of bom-local-service (e.g., http://localhost:8082)"
          ></ha-textfield>
          <ha-textfield
            label="Suburb"
            .value=${this._config.suburb || ''}
            @input=${(e: Event) => this._updateConfig('suburb', (e.target as HTMLInputElement).value)}
            required
          ></ha-textfield>
          <div class="select-wrapper">
            <label class="select-label">State *</label>
            <select
              class="native-select"
              .value=${this._config.state || ''}
              @change=${(e: Event) => {
                const select = e.target as HTMLSelectElement;
                this._updateConfig('state', select.value);
              }}
              required
            >
              <option value="">Select a state...</option>
              ${AUSTRALIAN_STATES.map(state => 
                html`<option value="${state.value}">${state.label} (${state.value})</option>`
              )}
            </select>
          </div>
        </div>

        <div class="section">
          <h3>Display</h3>
          <ha-switch
            label="Show Card Title"
            .checked=${this._config.show_card_title !== false}
            @change=${(e: Event) => {
              const checked = (e.target as HTMLInputElement).checked;
              this._updateConfig('show_card_title', checked);
            }}
          ></ha-switch>
          ${this._config.show_card_title !== false ? html`
            <ha-textfield
              label="Card Title"
              .value=${this._config.card_title || ''}
              @input=${(e: Event) => this._updateConfig('card_title', (e.target as HTMLInputElement).value)}
              helper="Leave empty to use default"
            ></ha-textfield>
          ` : ''}
          
          <div class="metadata-section">
            <div class="section-header">
              <ha-switch
                label="Show Metadata"
                .checked=${this._getMetadataEnabled()}
                @change=${(e: Event) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  this._updateMetadataToggle(checked);
                }}
              ></ha-switch>
              ${this._getMetadataEnabled() ? html`
                <ha-icon-button
                  .label=${this._metadataExpanded ? 'Collapse' : 'Expand'}
                  @click=${() => { this._metadataExpanded = !this._metadataExpanded; }}
                >
                  <ha-icon .icon=${this._metadataExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}></ha-icon>
                </ha-icon-button>
              ` : ''}
            </div>
            ${this._getMetadataEnabled() && this._metadataExpanded ? html`
              <div class="metadata-options">
                <ha-switch
                  label="Cache Status"
                  .checked=${this._getMetadataConfig('show_cache_status')}
                  @change=${(e: Event) => this._updateMetadataConfig('show_cache_status', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Observation Time"
                  .checked=${this._getMetadataConfig('show_observation_time')}
                  @change=${(e: Event) => this._updateMetadataConfig('show_observation_time', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Forecast Time"
                  .checked=${this._getMetadataConfig('show_forecast_time')}
                  @change=${(e: Event) => this._updateMetadataConfig('show_forecast_time', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Weather Station"
                  .checked=${this._getMetadataConfig('show_weather_station')}
                  @change=${(e: Event) => this._updateMetadataConfig('show_weather_station', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Distance"
                  .checked=${this._getMetadataConfig('show_distance')}
                  @change=${(e: Event) => this._updateMetadataConfig('show_distance', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Next Update"
                  .checked=${this._getMetadataConfig('show_next_update')}
                  @change=${(e: Event) => this._updateMetadataConfig('show_next_update', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Frame Times"
                  .checked=${this._getMetadataConfig('show_frame_times')}
                  @change=${(e: Event) => this._updateMetadataConfig('show_frame_times', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <div class="select-wrapper">
                  <label class="select-label">Metadata Position</label>
                  <select
                    class="native-select"
                    .value=${this._getMetadataConfig('position') || 'above'}
                    @change=${(e: Event) => {
                      const select = e.target as HTMLSelectElement;
                      this._updateMetadataConfig('position', select.value as 'above' | 'below' | 'overlay');
                    }}
                  >
                    <option value="above">Above Image</option>
                    <option value="below">Below Image</option>
                    <option value="overlay">Overlay on Image</option>
                  </select>
                </div>
                <div class="select-wrapper">
                  <label class="select-label">Metadata Style</label>
                  <select
                    class="native-select"
                    .value=${this._getMetadataConfig('style') || 'cards'}
                    @change=${(e: Event) => {
                      const select = e.target as HTMLSelectElement;
                      this._updateMetadataConfig('style', select.value as 'cards' | 'compact' | 'minimal');
                    }}
                  >
                    <option value="cards">Cards</option>
                    <option value="compact">Compact</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="controls-section">
            <div class="section-header">
              <ha-switch
                label="Show Controls"
                .checked=${this._getControlsEnabled()}
                @change=${(e: Event) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  this._updateControlsToggle(checked);
                }}
              ></ha-switch>
              ${this._getControlsEnabled() ? html`
                <ha-icon-button
                  .label=${this._controlsExpanded ? 'Collapse' : 'Expand'}
                  @click=${() => { this._controlsExpanded = !this._controlsExpanded; }}
                >
                  <ha-icon .icon=${this._controlsExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}></ha-icon>
                </ha-icon-button>
              ` : ''}
            </div>
            ${this._getControlsEnabled() && this._controlsExpanded ? html`
              <div class="controls-options">
                <ha-switch
                  label="Play/Pause Button"
                  .checked=${this._getControlsConfig('show_play_pause')}
                  @change=${(e: Event) => this._updateControlsConfig('show_play_pause', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Previous/Next Buttons"
                  .checked=${this._getControlsConfig('show_prev_next')}
                  @change=${(e: Event) => this._updateControlsConfig('show_prev_next', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Frame Slider"
                  .checked=${this._getControlsConfig('show_slider')}
                  @change=${(e: Event) => this._updateControlsConfig('show_slider', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Navigation Buttons (-10, +10, First, Last)"
                  .checked=${this._getControlsConfig('show_nav_buttons')}
                  @change=${(e: Event) => this._updateControlsConfig('show_nav_buttons', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Frame Info"
                  .checked=${this._getControlsConfig('show_frame_info')}
                  @change=${(e: Event) => this._updateControlsConfig('show_frame_info', (e.target as HTMLInputElement).checked)}
                ></ha-switch>
                <ha-switch
                  label="Overlay Controls on Image"
                  .checked=${this._config.overlay_controls || false}
                  @change=${(e: Event) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    this._updateConfig('overlay_controls', checked);
                  }}
                ></ha-switch>
                ${this._config.overlay_controls ? html`
                  <div class="select-wrapper">
                    <label class="select-label">Overlay Position</label>
                    <select
                      class="native-select"
                      .value=${this._config.overlay_position || 'bottom'}
                      @change=${(e: Event) => {
                        const select = e.target as HTMLSelectElement;
                        this._updateConfig('overlay_position', select.value);
                      }}
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="center">Center</option>
                    </select>
                  </div>
                  <ha-textfield
                    label="Overlay Opacity (0.0 - 1.0)"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    .value=${String(this._config.overlay_opacity ?? 0.9)}
                    @input=${(e: Event) => this._updateConfig('overlay_opacity', parseFloat((e.target as HTMLInputElement).value))}
                  ></ha-textfield>
                ` : ''}
              </div>
            ` : ''}
          </div>

          <ha-textfield
            label="Image Zoom (1.0 = 100%)"
            type="number"
            step="0.1"
            min="0.5"
            max="3.0"
            .value=${String(this._config.image_zoom || 1.0)}
            @input=${(e: Event) => this._updateConfig('image_zoom', parseFloat((e.target as HTMLInputElement).value))}
            helper="Zoom level: 0.5 = 50%, 1.0 = 100%, 2.0 = 200%"
          ></ha-textfield>
          <div class="select-wrapper">
            <label class="select-label">Image Fit</label>
            <select
              class="native-select"
              .value=${this._config.image_fit || 'contain'}
              @change=${(e: Event) => {
                const select = e.target as HTMLSelectElement;
                this._updateConfig('image_fit', select.value);
              }}
            >
              <option value="contain">Contain (fit entire image)</option>
              <option value="cover">Cover (fill container)</option>
              <option value="fill">Fill (stretch to fit)</option>
            </select>
          </div>
        </div>

        <div class="section">
          <h3>Slideshow</h3>
          <div class="select-wrapper">
            <label class="select-label">Timespan</label>
            <select
              class="native-select"
              .value=${this._config.timespan || 'latest'}
              @change=${(e: Event) => {
                const select = e.target as HTMLSelectElement;
                this._updateConfig('timespan', select.value);
              }}
            >
              <option value="latest">Latest 7 frames</option>
              <option value="1h">Last 1 hour</option>
              <option value="3h">Last 3 hours</option>
              <option value="6h">Last 6 hours</option>
              <option value="12h">Last 12 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="custom">Custom time range</option>
            </select>
          </div>
          <ha-textfield
            label="Frame Interval (seconds)"
            type="number"
            step="0.5"
            min="0.5"
            max="10"
            .value=${String(this._config.frame_interval || 2.0)}
            @input=${(e: Event) => this._updateConfig('frame_interval', parseFloat((e.target as HTMLInputElement).value))}
          ></ha-textfield>
          <ha-switch
            label="Auto Play"
            .checked=${this._config.auto_play !== false}
            @change=${(e: Event) => {
              const checked = (e.target as HTMLInputElement).checked;
              this._updateConfig('auto_play', checked);
            }}
          ></ha-switch>
        </div>

        <div class="section">
          <h3>Auto Refresh</h3>
          <ha-textfield
            label="Refresh Interval (seconds)"
            type="number"
            min="10"
            max="300"
            step="10"
            .value=${String(this._config.refresh_interval || 30)}
            @input=${(e: Event) => this._updateConfig('refresh_interval', parseInt((e.target as HTMLInputElement).value))}
          ></ha-textfield>
        </div>
      </div>
    `;
  }

  private _updateConfig(key: string, value: unknown): void {
    const config = { ...this._config, [key]: value };
    this._config = config;
    fireEvent(this, 'config-changed', { config });
  }

  // Metadata configuration helpers
  private _getMetadataEnabled(): boolean {
    const config = this._config.show_metadata;
    if (config === undefined || config === true) return true;
    if (typeof config === 'boolean') return config;
    return true; // Object means enabled with custom config
  }

  private _updateMetadataToggle(enabled: boolean): void {
    if (enabled) {
      // If enabling, check if we have existing config or create default
      if (typeof this._config.show_metadata === 'object') {
        // Keep existing config
        return;
      }
      // Create default config object
      this._updateConfig('show_metadata', {});
    } else {
      // Disable metadata
      this._updateConfig('show_metadata', false);
    }
  }

  private _getMetadataConfig(key: keyof MetadataDisplayConfig): boolean {
    const config = this._config.show_metadata;
    if (typeof config === 'boolean') {
      return config; // If boolean, all metadata follows this value
    }
    if (typeof config === 'object') {
      return config[key] !== false; // Default to true if not explicitly false
    }
    return true; // Default
  }

  private _updateMetadataConfig(key: keyof MetadataDisplayConfig, value: boolean | string): void {
    let config: MetadataDisplayConfig;
    
    if (typeof this._config.show_metadata === 'object') {
      config = { ...this._config.show_metadata };
    } else {
      config = {};
    }
    
    // Type-safe assignment based on key
    if (key === 'position' || key === 'style') {
      (config as any)[key] = value;
    } else {
      (config as any)[key] = value;
    }
    this._updateConfig('show_metadata', config);
  }

  // Controls configuration helpers
  private _getControlsEnabled(): boolean {
    const config = this._config.show_controls;
    if (config === undefined || config === true) return true;
    if (typeof config === 'boolean') return config;
    return true; // Object means enabled with custom config
  }

  private _updateControlsToggle(enabled: boolean): void {
    if (enabled) {
      // If enabling, check if we have existing config or create default
      if (typeof this._config.show_controls === 'object') {
        // Keep existing config
        return;
      }
      // Create default config object
      this._updateConfig('show_controls', {});
    } else {
      // Disable controls
      this._updateConfig('show_controls', false);
    }
  }

  private _getControlsConfig(key: keyof ControlsDisplayConfig): boolean {
    const config = this._config.show_controls;
    if (typeof config === 'boolean') {
      return config;
    }
    if (typeof config === 'object') {
      return config[key] !== false;
    }
    return true; // Default
  }

  private _updateControlsConfig(key: keyof ControlsDisplayConfig, value: boolean): void {
    let config: ControlsDisplayConfig;
    
    if (typeof this._config.show_controls === 'object') {
      config = { ...this._config.show_controls };
    } else {
      config = {};
    }
    
    // All control config values are boolean (position is handled separately in template)
    (config as any)[key] = value;
    this._updateConfig('show_controls', config);
  }

  static styles: CSSResultGroup = css`
    .editor { 
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .section { 
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      background: var(--card-background-color, #ffffff);
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
    }
    
    .section h3 { 
      margin: 0;
      font-weight: 600; 
      font-size: 1.1em;
      color: var(--primary-text-color, #212121);
      padding-bottom: 8px;
      border-bottom: 2px solid var(--divider-color, #e0e0e0);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding: 8px 0;
    }
    
    .metadata-section,
    .controls-section {
      margin-top: 0;
      padding: 12px;
      background: var(--secondary-background-color, #fafafa);
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
    }
    
    .metadata-options,
    .controls-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    
    ha-textfield {
      display: block;
      width: 100%;
      margin-bottom: 0;
    }
    
    .select-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .select-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }
    
    .native-select {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, #ffffff);
      color: var(--primary-text-color, #212121);
      font-size: 1rem;
      font-family: inherit;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    
    .native-select:hover {
      border-color: var(--primary-color, #03a9f4);
    }
    
    .native-select:focus {
      outline: none;
      border-color: var(--primary-color, #03a9f4);
      box-shadow: 0 0 0 2px rgba(3, 169, 244, 0.2);
    }
    
    ha-switch {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      margin-bottom: 0;
    }
    
    ha-icon-button {
      --mdc-icon-button-size: 32px;
    }
  `;
}









