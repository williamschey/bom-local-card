# BOM Local Radar Card

A Home Assistant custom card that displays Australian Bureau of Meteorology (BOM) rain radar data using the local [BOM Local Service](https://github.com/alexhopeoconnor/bom-local-service).

## Background

The Australian Bureau of Meteorology's radar API endpoint stopped working in December 2024, breaking integrations like the popular bom-radar-card for Home Assistant. This card works alongside the [BOM Local Service](https://github.com/alexhopeoconnor/bom-local-service) to provide a reliable local solution by consuming cached radar data from a local service.

## Features

- 🌧️ **Live Radar Display**: View the latest BOM rain radar images for any Australian location
- 🎬 **Animated Slideshow**: Play through radar frames to see precipitation movement
- 📊 **Historical Data**: View radar history from 1 hour to 24 hours ago
- 🎯 **Location-Based**: Support for any Australian suburb/state combination
- 🔄 **Auto-Refresh**: Automatically updates radar data at configurable intervals
- 🎨 **Beautiful UI**: Modern, responsive design that integrates seamlessly with Home Assistant themes
- ⚙️ **Visual Editor**: Full GUI configuration editor (no YAML editing required)

## Prerequisites

1. **BOM Local Service**: This card requires the [BOM Local Service](https://github.com/alexhopeoconnor/bom-local-service) to be running. The service provides the cached radar data that the card displays.
   
   See the [BOM Local Service README](https://github.com/alexhopeoconnor/bom-local-service) for installation instructions.

2. **Home Assistant**: Version 2024.1.0 or later

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to **Frontend** → **Explore & Download Repositories**
3. Search for **BOM Local Radar Card**
4. Click **Download**
5. Restart Home Assistant

### Manual Installation

1. Download the latest `bom-local-radar-card.js` from the [releases page](https://github.com/alexhopeoconnor/bom-local-card/releases)
2. Copy the file to your Home Assistant `www` directory (usually `/config/www/`)
3. Add the resource reference to your Lovelace configuration:

   **Option A: Via UI** (Recommended)
   - Go to **Settings** → **Dashboards** → **Resources** (three dots menu)
   - Click **Add Resource**
   - Set URL to `/local/bom-local-radar-card.js`
   - Set Resource type to **JavaScript Module**
   - Click **Create**

   **Option B: Via YAML**
   Add to your `configuration.yaml`:
   ```yaml
   lovelace:
     resources:
       - url: /local/bom-local-radar-card.js
         type: module
   ```
4. Restart Home Assistant

## Configuration

### Using the Visual Editor (Recommended)

1. Add a card to your Lovelace dashboard
2. Search for **BOM Local Radar Card** or select **Custom: BOM Local Radar Card**
3. Configure using the visual editor:
   - **Service URL**: Base URL of your BOM Local Service (default: `http://localhost:8082`)
   - **Suburb**: The suburb name (e.g., `Pomona`, `Brisbane`)
   - **State**: State abbreviation (e.g., `QLD`, `NSW`, `VIC`)
   - **Card Title**: Optional custom title for the card
   - **Show Metadata**: Toggle to show/hide cache status and observation time
   - **Timespan**: Select historical data range (Latest, 1h, 3h, 6h, 12h, 24h)
   - **Frame Interval**: Seconds between frames during animation (default: 2.0)
   - **Auto Play**: Automatically start animation when data loads
   - **Refresh Interval**: Seconds between automatic data refreshes (default: 30)

### Using YAML

```yaml
type: custom:bom-local-radar-card
service_url: http://localhost:8082
suburb: Pomona
state: QLD
card_title: Local Weather Radar
show_metadata: true
timespan: latest
frame_interval: 2.0
auto_play: true
refresh_interval: 30
```

### Configuration Options

| Option | Type | Default | Required | Description |
|--------|------|---------|----------|-------------|
| `service_url` | string | `http://localhost:8082` | No | Base URL of the BOM Local Service |
| `suburb` | string | - | **Yes** | Suburb name (e.g., "Pomona", "Brisbane") |
| `state` | string | - | **Yes** | State abbreviation (e.g., "QLD", "NSW", "VIC") |
| `card_title` | string | - | No | Custom title displayed at the top of the card |
| `show_metadata` | boolean | `true` | No | Show/hide cache status, observation time, and weather station info |
| `timespan` | string | `latest` | No | Historical data timespan: `latest`, `1h`, `3h`, `6h`, `12h`, `24h`, or `custom` |
| `frame_interval` | number | `2.0` | No | Seconds between frames during animation (0.5-10) |
| `auto_play` | boolean | `true` | No | Automatically start animation when data loads |
| `refresh_interval` | number | `30` | No | Seconds between automatic data refreshes (10-300) |
| `custom_start_time` | string | - | No | ISO 8601 datetime for custom timespan start (requires `timespan: custom`) |
| `custom_end_time` | string | - | No | ISO 8601 datetime for custom timespan end (requires `timespan: custom`) |

## Usage Examples

### Basic Configuration

Display the latest radar frames for a location:

```yaml
type: custom:bom-local-radar-card
suburb: Brisbane
state: QLD
service_url: http://192.168.1.100:8082
```

### Historical Data (Last 3 Hours)

View radar history from the past 3 hours:

```yaml
type: custom:bom-local-radar-card
suburb: Melbourne
state: VIC
service_url: http://192.168.1.100:8082
timespan: 3h
auto_play: true
frame_interval: 1.5
```

### Custom Time Range

View radar data for a specific time period:

```yaml
type: custom:bom-local-radar-card
suburb: Sydney
state: NSW
service_url: http://192.168.1.100:8082
timespan: custom
custom_start_time: "2024-01-15T10:00:00Z"
custom_end_time: "2024-01-15T14:00:00Z"
```

### Manual Control (No Auto-Play)

Display radar with manual controls only:

```yaml
type: custom:bom-local-radar-card
suburb: Adelaide
state: SA
service_url: http://192.168.1.100:8082
auto_play: false
frame_interval: 3.0
```

### Different Service Location

If your BOM Local Service is running on a different machine:

```yaml
type: custom:bom-local-radar-card
suburb: Perth
state: WA
service_url: http://192.168.1.50:8082
refresh_interval: 60
```

## Controls

The card provides several controls for navigating radar frames:

- **Play/Pause Button**: Start or stop the animation
- **Previous/Next Buttons**: Navigate to the previous or next frame
- **Frame Slider**: Drag to jump to any frame
- **Navigation Buttons**:
  - ⏮ First frame
  - -10 / +10: Jump backward/forward by 10 frames
  - ⏭ Last frame

The card displays frame information including frame number, total frames, and timestamp.

## Troubleshooting

### Card Shows "Configuration Error"

- Ensure both `suburb` and `state` are configured
- Verify the configuration using the visual editor

### Card Shows "Failed to fetch radar data" or "Cache not ready"

- **Check BOM Local Service is running**: Verify the service is accessible at the configured `service_url`
- **Verify Service URL**: Ensure the URL is correct and reachable from your Home Assistant instance
- **Check Cache Status**: The service may be generating the cache for your location. Wait a minute and refresh
- **Network Access**: If the service is on a different machine, ensure network connectivity and firewall rules allow access

### Card Shows "Radar data not found"

- The cache may not be available for your location yet
- Trigger a cache update via the BOM Local Service API:
  ```bash
  curl -X POST http://your-service-url/api/cache/YourSuburb/YourState/refresh
  ```

### Images Don't Load

- Check browser console for CORS errors (may indicate service configuration issue)
- Verify the service URL is correct and images are accessible
- If using a different machine, ensure CORS is properly configured in the service

### Animation Not Playing

- Check that `auto_play` is set to `true` (default)
- Verify frames are loading (check frame count display)
- Try manually clicking the Play button

### Service URL Configuration

- **Local service**: Use `http://localhost:8082` if the service runs on the same machine as Home Assistant
- **Remote service**: Use the IP address or hostname of the machine running the service (e.g., `http://192.168.1.100:8082`)
- **Docker network**: If Home Assistant and the service are in the same Docker network, use the service container name (e.g., `http://bom-local-service:8080`)

## Development

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/alexhopeoconnor/bom-local-card.git
   cd bom-local-card
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the card:
   ```bash
   npm run build
   ```

   The built file will be in `dist/bom-local-radar-card.js`

4. For development with watch mode:
   ```bash
   npm run watch
   ```

### Testing with Home Assistant

The repository includes Docker Compose configuration for testing with Home Assistant:

```bash
npm run test:ha
```

This will:
- Start Home Assistant in a Docker container
- Build and copy the card to the Home Assistant `www` directory
- Allow you to test the card in a real Home Assistant environment

## License

MIT License - see [LICENSE](LICENSE) file for details

## Credits

- Built for use with [BOM Local Service](https://github.com/alexhopeoconnor/bom-local-service)
- Inspired by the original [bom-radar-card](https://github.com/Makin-Things/bom-radar-card) project

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/alexhopeoconnor/bom-local-card).

