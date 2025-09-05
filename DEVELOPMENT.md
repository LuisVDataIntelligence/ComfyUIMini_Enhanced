# ComfyUIMini Enhanced - Development Guide

## Development Setup

### Prerequisites
- **ComfyUI**: Ensure ComfyUI is installed and functional (minimum v0.2.2-50-7183fd1 / Sep. 18th release)
- **Bun**: Version 1.0+ (preferred) or Node.js 20.0.0+
- **Modern Browser**: Any browser with WebSocket support

### Installation & Setup
```bash
# Clone and install dependencies
git clone <repository>
cd ComfyUIMini_Enhanced
bun install

# Start development server
bun dev                          # Client development server
cd server && bun run index.ts   # Server development mode
```

## Development Commands

### Client (Vue.js Frontend)
```bash
cd client
bun dev                          # Start development server with hot reload
bun --bunx vite build           # Build for production
vue-tsc -b && vite build        # Build with TypeScript checking
```

### Server (Bun Backend)
```bash
cd server
bun start                        # Production server
bun run index.ts                # Development server with default settings
bun run index.ts --host 0.0.0.0 --debug  # LAN access + debug mode
tsc --noEmit                    # TypeScript type checking
```

### Root Commands
```bash
bun dev                         # Start client development server
bun start                       # Start production server
./runcomfyuimini.sh            # Start with environment configuration
```

## Environment Configuration

Create `.env` file in root directory:
```bash
# Network Configuration
HOST=0.0.0.0                   # Use 0.0.0.0 for LAN access, localhost for local only
PORT=1811                      # Server port

# Debug Configuration
DEBUG=true                     # Enable debug mode with enhanced logging
DEBUG_CONNECTION=true          # Enable connection debugging
DEBUG_CONFIG=true              # Enable configuration change debugging

# Build Configuration
FORCE_BUILD=false              # Force rebuild of client files
BUILD_PATH=./build             # Path to built client files
```

## Architecture Overview

### Project Structure
- **client/** - Vue 3 frontend with TypeScript, Tailwind CSS, Pinia
- **server/** - Bun/Hono backend server with API validation
- **config/** - Configuration files including tag autocomplete data
- **shared/** - Shared types and utilities

### Key Technologies
- **Frontend**: Vue 3, TypeScript, Tailwind CSS 4.x, Pinia, Vue Router, Vite
- **Backend**: Bun runtime, Hono framework, Zod validation
- **Build Tools**: Vite for client, Bun for server

### Server Architecture
- **Routes**: 
  - `/api/comfyui/*` - Proxy to ComfyUI backend with Zod schema validation
  - `/api/tags/*` - Tag search and autocomplete
  - `/api/debug/*` - Debug utilities
- **Static Serving**: Client build files served from configurable build path
- **Validation**: Zod schemas for API request validation (see `server/src/schemas/`)

### Client Architecture
- **Views**: Home, Import, Generate, Workflow, Settings, History
- **Stores**: 
  - `comfyui.ts` - ComfyUI connection and data management
  - `config.ts` - User configuration and settings
  - `appWorkflows.ts` - Workflow management
- **Components**: Reusable UI components with TypeScript
- **Autocomplete System**: Tag suggestion engine with alias support

## Debug Mode

### Starting with Debug
```bash
# Basic debug mode (enables all features)
bun run start --debug

# Granular debug control
bun run start --debug-connection    # Connection logging only
bun run start --debug-config       # Configuration change logging only

# Combined debug options
bun run start --debug --debug-connection --debug-config
```

### Debug Environment Variables
```bash
NODE_ENV=development            # Enables debug features
DEBUG_CONNECTION_LOGS=true      # Connection debugging
DEBUG_CONFIG_CHANGES=true       # Configuration change tracking
DEBUG_WEBSOCKET=true           # WebSocket debugging
```

## Important Files

### Core Files
- `server/index.ts` - Main server entry point
- `client/src/main.ts` - Vue app initialization
- `client/src/lib/router.ts` - Vue Router configuration
- `client/src/stores/comfyui.ts` - ComfyUI integration
- `client/src/lib/tagAutocomplete.ts` - Tag autocomplete logic
- `client/src/styles/autocomplete.css` - Autocomplete component styles

### API & Validation
- `server/src/routes/comfyuiRouter.ts` - ComfyUI API proxy with validation
- `server/src/routes/tagSearchRouter.ts` - Tag search API
- `server/src/schemas/comfyui.ts` - Zod validation schemas

## Tag Autocomplete Setup

### Tag Data Format
Place CSV file at `config/tags.csv` with format:
```csv
Main Tag,Number of Aliases,Post Count,"Alias1,Alias2,Alias3"
1girl,0,6008644,"1girls,sole_female"
highres,5,5256195,"high_res,high_resolution,hires"
```

### Configuration
- Autocomplete appears when typing in prompt fields (minimum 2 characters)
- Aliases are replaced with main tags when selected
- Tags sorted by popularity (post count)
- Setting to replace underscores with spaces available in UI

## Development Notes

### Code Style & Architecture
- All CSS variables use consistent design tokens (see `client/src/assets/style/style.css`)
- API requests validated using Zod schemas for type safety and security
- Uses workspaces configuration for monorepo management
- Server automatically builds client if needed on startup
- Client uses server proxy to avoid ComfyUI CORS issues

### Common Tasks
- **Adding new API routes**: Create in `server/src/routes/` with Zod validation
- **Adding CSS variables**: Define in `client/src/assets/style/style.css` using oklch colors
- **Debugging**: Use environment variables or CLI flags for granular control
- **Testing**: Ensure ComfyUI is running before testing full workflow functionality

### Build Process
1. Client builds to `client/dist/`
2. Server copies client build to `server/build/`
3. Production server serves static files from build directory
4. Environment variables can override build paths and behavior

## API Validation

All ComfyUI API endpoints use Zod schema validation:
- Request payloads are validated before forwarding to ComfyUI
- Validation errors return detailed feedback with HTTP 400
- See `server/src/schemas/comfyui.ts` for schema definitions
- Workflow validation ensures proper node structure and inputs