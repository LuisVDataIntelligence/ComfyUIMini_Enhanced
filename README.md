# ComfyUI Mini Enhanced

A mobile-friendly WebUI to run ComfyUI workflows with enhanced features and improved user experience.

![App Preview](https://github.com/user-attachments/assets/78a52443-ac9c-498c-8df3-129acd94a48c)

## Features

- ⚡ **Lightweight UI** - Optimized for mobile devices and touch interfaces
- 💾 **Workflow Management** - Save and organize workflows on device or PC
- ⏳ **Progress Tracking** - Real-time progress information during image generation
- 🤖 **Smart Import** - Automatic workflow importing and validation
- 🖼️ **Image Gallery** - View and manage all generated images
- 🏷️ **Tag Autocomplete** - Booru-style autocomplete for prompt inputs with alias support
- 🔒 **API Validation** - Secure request validation and error handling
- 🎨 **Modern Design** - Clean, responsive interface with dark theme support

## Requirements

### Server (Hosting):
- **ComfyUI**: Version v0.2.2-50-7183fd1 or higher (September 18th release+)
- **Bun**: Version 1.0+ (recommended) or Node.js 20.0.0+
- **Operating System**: Windows, macOS, or Linux

### Client (Accessing):
- **Browser**: Any modern browser with WebSocket support
- **Network**: Connection to the same network as the hosting server

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ComfyUIMini_Enhanced
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Start the server**:
   ```bash
   ./runcomfyuimini.sh
   ```
   
   Or manually:
   ```bash
   bun start
   ```

4. **Access the interface**:
   - Local: `http://localhost:1811`
   - Network: `http://<your-ip>:1811`

## Configuration

### Environment Setup

Create a `.env` file in the root directory:

```bash
# Network Configuration
HOST=0.0.0.0          # Use 0.0.0.0 for LAN access, localhost for local only
PORT=1811             # Server port

# Optional: ComfyUI URL (if not default)
COMFYUI_URL=http://localhost:8188
```

### Tag Autocomplete Setup

To enable booru-style tag suggestions:

1. **Download tag data**: Get the latest tag file from [Danbooru/e621 autocomplete tag lists](https://civitai.com/models/950325/danboorue621-autocomplete-tag-lists-incl-aliases-krita-ai-support) on Civitai

2. **Install tags**: Extract and copy one of the CSV files to `config/tags.csv`

3. **Configure**: Access UI settings to enable underscore-to-space replacement if desired

## Usage

### Workflow Management
- **Import**: Drag and drop workflow JSON files or use the import button
- **Edit**: Modify parameters directly in the interface
- **Save**: Workflows are automatically saved to local storage
- **Export**: Download workflows for sharing or backup

### Image Generation
- **Queue**: Submit workflows to ComfyUI for processing
- **Monitor**: Track progress with real-time updates
- **Gallery**: View generated images in the built-in gallery
- **Download**: Save images directly to your device

### Tag Autocomplete
- Start typing in prompt fields (minimum 2 characters)
- Select from suggested tags sorted by popularity
- Aliases automatically resolve to main tags
- Supports both underscores and spaces

## Troubleshooting

### Common Issues

**Q**: I can't import my workflow
- **A**: Save your workflow in API Format in ComfyUI. Regular saves don't provide enough information. See [this guide](https://imgur.com/a/YsZQu83) for enabling API format.

**Q**: Can't connect to ComfyUI
- **A**: Ensure ComfyUI is running on `http://localhost:8188` or update `COMFYUI_URL` in your `.env` file.

**Q**: Tag autocomplete not working
- **A**: Verify that `config/tags.csv` exists and is properly formatted. Check the console for any loading errors.

**Q**: Interface not accessible from other devices
- **A**: Set `HOST=0.0.0.0` in your `.env` file and ensure your firewall allows connections on port 1811.

### Network Access

To access from other devices on your network:

1. Set `HOST=0.0.0.0` in `.env`
2. Configure firewall to allow port 1811
3. Use your computer's IP address: `http://<your-ip>:1811`

**Security Note**: Network access allows anyone on your network to use the interface. For external access, consider using a VPN or port forwarding (with appropriate security measures).

## Support

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/ImDarkTom/ComfyUIMini).

For development information, see [DEVELOPMENT.md](DEVELOPMENT.md).

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.