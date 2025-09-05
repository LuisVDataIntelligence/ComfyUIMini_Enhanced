# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Client (Vue.js Frontend)
- `cd client && bun dev` - Start development server with hot reload
- `cd client && bun --bunx vite build` - Build for production
- `cd client && vue-tsc -b && vite build` - Build with TypeScript checking

### Server (Bun Backend)
- `cd server && bun start` - Start production server
- `cd server && bun run index.ts` - Start development server

### Root Commands
- `bun dev` - Start client development server (from root)
- `bun start` - Start production server (from root)

## Architecture Overview

This is a monorepo with client-server architecture for ComfyUI Mini, a mobile-friendly WebUI for running ComfyUI workflows.

### Project Structure
- **client/** - Vue 3 frontend with TypeScript, Tailwind CSS, Pinia for state management
- **server/** - Bun/Hono backend server that proxies ComfyUI requests and handles tag search
- **config/** - Configuration files including tag autocomplete data (tags.csv)

### Key Technologies
- **Frontend**: Vue 3, TypeScript, Tailwind CSS 4.x, Pinia, Vue Router, Vite
- **Backend**: Bun runtime, Hono framework for routing
- **Build Tools**: Vite for client, Bun for server

### Core Features
1. **ComfyUI Integration**: Proxy server handles ComfyUI API communication to avoid CORS issues
2. **Tag Autocomplete**: Booru-style tag suggestions using CSV data loaded on server
3. **Workflow Management**: Import, edit, and run ComfyUI workflows
4. **Mobile-First**: Responsive design optimized for mobile devices
5. **State Persistence**: Pinia with persistent state plugin

### Server Architecture
- **Routes**: 
  - `/api/comfyui/*` - Proxy to ComfyUI backend
  - `/api/tags/*` - Tag search and autocomplete
  - `/api/debug/*` - Debug utilities
- **Static Serving**: Client build files served from configurable build path
- **CLI Args**: Configurable host, port, build path, and force build options

### Client Architecture
- **Views**: Home, Import, Generate, Workflow, Settings, History
- **Stores**: 
  - `comfyui.ts` - ComfyUI connection and data management
  - `config.ts` - User configuration and settings
  - `appWorkflows.ts` - Workflow management
- **Components**: Reusable UI components with TypeScript
- **Autocomplete System**: Tag suggestion engine with alias support

### Important Files
- `server/index.ts` - Main server entry point
- `client/src/main.ts` - Vue app initialization
- `client/src/lib/router.ts` - Vue Router configuration
- `client/src/stores/comfyui.ts` - ComfyUI integration
- `client/src/lib/tagAutocomplete.ts` - Tag autocomplete logic
- `server/src/routes/tagSearchRouter.ts` - Tag search API

### Development Notes
- Uses workspaces configuration for monorepo management
- Server automatically builds client if needed on startup
- Tag autocomplete requires `config/tags.csv` file with booru-style tag data
- Client uses server proxy to avoid ComfyUI CORS issues