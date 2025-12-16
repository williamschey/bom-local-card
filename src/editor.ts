import { LitElement, html, css, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor, fireEvent } from 'custom-card-helpers';
import type { TemplateResult } from 'lit';
import { BomLocalRadarCardConfig } from './types';

@customElement('bom-local-radar-card-editor')
export class BomLocalRadarCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: BomLocalRadarCardConfig = this._mergeWithDefaults();

  private _mergeWithDefaults(config: Partial<BomLocalRadarCardConfig> = {}): BomLocalRadarCardConfig {
    const defaults: Partial<BomLocalRadarCardConfig> = {
      service_url: 'http://localhost:8082',
      timespan: 'latest',
      frame_interval: 2.0,
      refresh_interval: 30,
      auto_play: true,
      show_timestamp: true,
      show_metadata: true,
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
          <ha-textfield
            label="State"
            .value=${this._config.state || ''}
            @input=${(e: Event) => this._updateConfig('state', (e.target as HTMLInputElement).value)}
            helper="State abbreviation (e.g., QLD, NSW, VIC)"
            required
          ></ha-textfield>
        </div>

        <div class="section">
          <h3>Display</h3>
          <ha-textfield
            label="Card Title"
            .value=${this._config.card_title || ''}
            @input=${(e: Event) => this._updateConfig('card_title', (e.target as HTMLInputElement).value)}
          ></ha-textfield>
          <ha-switch
            label="Show Metadata"
            .checked=${this._config.show_metadata !== false}
            @change=${(e: Event) => this._updateConfig('show_metadata', (e.target as HTMLInputElement).checked)}
          ></ha-switch>
        </div>

        <div class="section">
          <h3>Slideshow</h3>
          <ha-select
            label="Timespan"
            .value=${this._config.timespan || 'latest'}
            @selected=${(e: Event) => this._updateConfig('timespan', (e.target as HTMLSelectElement).value)}
          >
            <option value="latest">Latest 7 frames</option>
            <option value="1h">Last 1 hour</option>
            <option value="3h">Last 3 hours</option>
            <option value="6h">Last 6 hours</option>
            <option value="12h">Last 12 hours</option>
            <option value="24h">Last 24 hours</option>
          </ha-select>
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
            @change=${(e: Event) => this._updateConfig('auto_play', (e.target as HTMLInputElement).checked)}
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

  static styles: CSSResultGroup = css`
    .editor { padding: 8px 16px; }
    .section { margin: 12px 0; }
    .section h3 { margin: 0 0 8px; font-weight: 600; }
  `;
}









