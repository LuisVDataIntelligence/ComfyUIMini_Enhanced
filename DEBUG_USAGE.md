# Debug Mode Usage Guide

## Starting the Server with Debug

### Basic Debug Mode
```bash
# Enable debug mode (enables all debug features)
bun run start --debug

# Or using npm/node
npm run start -- --debug
```

### Granular Debug Control
```bash
# Enable only connection logging
bun run start --debug-connection

# Enable only configuration change logging  
bun run start --debug-config

# Enable multiple specific debug features
bun run start --debug-connection --debug-config

# Enable all debug features explicitly
bun run start --debug --debug-connection --debug-config
```

### Environment Variables
You can also use environment variables:
```bash
# Set for the session
export NODE_ENV=development
export DEBUG_CONNECTION_LOGS=true
export DEBUG_CONFIG_CHANGES=true
bun run start

# Or inline
NODE_ENV=development DEBUG_CONNECTION_LOGS=true bun run start
```

## Debug Features

### 1. Connection Testing Debug
When enabled with `--debug-connection`:
- Detailed fetch request logging
- Request/response timing
- Error categorization and stack traces
- URL generation tracking

Example output:
```
[DEBUG] Testing connection to: http://localhost:49170
[DEBUG] Config state: { base: "localhost:49170", secure: false, custom: false }
[DEBUG] Response status: 200
```

### 2. Configuration Change Debug
When enabled with `--debug-config`:
- Settings value change tracking
- URL generation updates
- Store state mutations
- Computed property recalculations

Example output:
```
[DEBUG] Base URL changed from "localhost:8188" to "localhost:49170"
[DEBUG] Generated URL: http://localhost:49170
[DEBUG] Generated WS: ws://localhost:49170/ws
```

### 3. Debug UI Controls
When debug mode is active, additional controls appear in Settings:
- **Test Base Connection**: Manual connection testing with full logging
- **Dump Config to Console**: Complete configuration state export
- **Reset Connection Status**: Clear cached connection results

## API Endpoints

### Debug Configuration
```bash
# Get current debug configuration
curl http://localhost:1811/api/debug/config

# Example response:
{
  "enabled": true,
  "showConnectionLogs": true,
  "showConfigChanges": true,
  "buildType": "debug",
  "environment": "development"
}
```

### Server Test Connection
```bash
# Test connection from server side
curl -X POST http://localhost:1811/api/debug/test-connection \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:49170"}'

# Example response:
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "responseTime": 45,
  "headers": {
    "content-type": "text/html",
    "access-control-allow-origin": "*"
  }
}
```

### Server Debug Info
```bash
# Get server debug information
curl http://localhost:1811/api/debug/info

# Example response:
{
  "version": "2.0.0",
  "nodeEnv": "development",
  "platform": "linux",
  "nodeVersion": "v20.5.0",
  "uptimeSeconds": 123.45,
  "memoryUsage": {
    "rss": 50331648,
    "heapTotal": 29360128,
    "heapUsed": 18874896,
    "external": 1479372
  },
  "debugFlags": {
    "debug": true,
    "debugConnection": true,
    "debugConfig": true
  }
}
```

## Production Safety

Debug features are completely disabled in production:
- `NODE_ENV=production` disables all debug endpoints
- Debug UI is hidden in production builds
- Debug configuration always returns disabled state
- No performance impact on production deployments

## Troubleshooting Common Issues

### Connection Test Failures
1. Enable debug mode: `--debug-connection`
2. Check browser console for detailed logs
3. Use "Test Base Connection" button in Settings
4. Check server-side test: `POST /api/debug/test-connection`

### URL Generation Problems
1. Enable config debugging: `--debug-config`
2. Change URL settings and watch console
3. Use "Dump Config to Console" to see full state
4. Compare generated URLs with expected values

### Debug Mode Not Working
1. Check `NODE_ENV` is not set to `production`
2. Verify server started with debug flags
3. Check `/api/debug/config` endpoint
4. Look for debug section in Settings page

## Development Tips

### Console Log Filtering
In browser DevTools Console, filter logs:
```
[DEBUG]     # Show only debug logs
[DEBUG] [CONNECTION]  # Show only connection debug logs
[DEBUG] [CONFIG]      # Show only config debug logs
```

### Using with VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server/index.ts",
  "args": ["--debug", "--debug-connection", "--debug-config"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Package.json Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "dev:debug": "bun run start --debug",
    "dev:debug-connection": "bun run start --debug-connection",
    "dev:debug-full": "bun run start --debug --debug-connection --debug-config"
  }
}
```