# Developer Debug Documentation

## Overview

ComfyUIMini includes a comprehensive debug system for troubleshooting configuration issues, connection problems, and development tasks. Debug functionality is controlled server-side and only enabled in development builds.

## Debug Configuration

### Server-Side Control
Debug mode is controlled by environment variables and build configuration:

```bash
# Development mode - enables debug features
NODE_ENV=development

# Specific debug flags
DEBUG_CONNECTION_LOGS=true
DEBUG_CONFIG_CHANGES=true
DEBUG_WEBSOCKET=true
```

### Build-Time Configuration
- **Production builds**: Debug features are completely stripped out
- **Development builds**: Debug features available but off by default
- **Debug builds**: All debug features enabled by default

## Debug Features

### 1. Connection Testing Debug
**Location**: `client/src/stores/config.ts` - `testConnection()` method

**Features**:
- Detailed fetch request logging
- Request/response timing
- Error categorization (CORS, network, timeout)
- URL generation tracking

**Usage**:
```javascript
// Logs when debug.showConnectionLogs is enabled
console.log(`[DEBUG] Testing connection to: ${url}`);
console.log(`[DEBUG] Config state:`, configSnapshot);
```

### 2. Configuration State Tracking
**Location**: `client/src/views/Settings/Settings.vue` - watchers

**Features**:
- URL generation changes
- Settings value changes
- Store state mutations
- Computed property updates

**Usage**:
```javascript
// Logs when debug.enabled is true
console.log(`[DEBUG] Base URL changed from "${oldValue}" to "${newValue}"`);
console.log(`[DEBUG] Generated URL: ${config.comfyUiUrl}`);
```

### 3. Manual Debug Tools
**Location**: Settings page Debug section (dev builds only)

**Tools Available**:
- **Test Base Connection**: Manual connection testing with full logging
- **Dump Config to Console**: Complete configuration state export
- **Reset Connection Status**: Clear cached connection results
- **WebSocket Debug**: Real-time WebSocket message logging

## Debug UI Components

### Debug Section (Development Only)
```vue
<!-- Only shown when server sends debug=true -->
<div v-if="debugMode" class="debug-panel">
  <h3>Debug Controls</h3>
  <!-- Debug buttons and controls -->
</div>
```

### Connection Status Debug
Enhanced connection status component shows additional debug info:
- Request timing
- Endpoint attempted
- Full error stack traces
- Network conditions

## Console Log Format

All debug logs follow a consistent format:

```
[DEBUG] [Component] Message
[DEBUG] [CONNECTION] Testing connection to: http://localhost:8188
[DEBUG] [CONFIG] Base URL changed from "localhost:8188" to "localhost:49170"
[DEBUG] [WEBSOCKET] Connection opened: ws://localhost:49170/ws
```

## Common Debug Scenarios

### Connection Issues
1. Enable connection logging
2. Attempt connection
3. Check console for detailed fetch logs
4. Look for CORS, timeout, or network errors

### URL Generation Problems
1. Enable debug mode
2. Change URL settings
3. Watch console for URL computation logs
4. Use "Dump Config" to see full state

### WebSocket Problems
1. Enable WebSocket debugging
2. Monitor connection attempts
3. Track message flow
4. Check close/error events

## API Debug Endpoints

### Development Server Endpoints
```
GET /debug/config - Current server debug configuration
GET /debug/connections - Active WebSocket connections
POST /debug/test-connection - Test connection to ComfyUI
GET /debug/logs - Recent debug logs
```

### Debug Headers
Development builds include debug headers:
```
X-Debug-Mode: true
X-Debug-Features: connection,config,websocket
X-Build-Type: development
```

## Environment Setup

### For Development
```bash
# .env.development
NODE_ENV=development
DEBUG_CONNECTION_LOGS=true
DEBUG_CONFIG_CHANGES=true
VITE_DEBUG_MODE=true
```

### For Production
```bash
# .env.production  
NODE_ENV=production
# Debug flags ignored in production
```

## Debug Store Structure

```typescript
interface DebugConfig {
  enabled: boolean;           // Master debug toggle
  showConnectionLogs: boolean; // Connection test logging
  showConfigChanges: boolean;  // Settings change logging
  showWebSocketLogs: boolean;  // WebSocket message logging
  buildType: 'development' | 'production' | 'debug';
}
```

## Security Considerations

- **Production Safety**: Debug features completely removed from production builds
- **No Sensitive Data**: Debug logs never include authentication tokens or secrets
- **Local Only**: Debug endpoints only accessible from localhost
- **Rate Limited**: Debug endpoints have strict rate limits

## Performance Impact

- **Zero Production Impact**: Debug code is tree-shaken out of production builds
- **Minimal Dev Impact**: Debug logging is conditional and lightweight
- **Memory Safe**: Debug logs are rotated and size-limited

## Troubleshooting Guide

### Debug Not Working
1. Check `NODE_ENV=development`
2. Verify debug environment variables
3. Check browser console for error messages
4. Ensure development server is running

### Missing Debug UI
1. Debug UI only shows in development builds
2. Check server debug configuration endpoint
3. Verify client receives debug flag from server

### Console Logs Not Appearing
1. Check debug toggles are enabled
2. Verify console log level settings
3. Look for `[DEBUG]` prefix in console filter