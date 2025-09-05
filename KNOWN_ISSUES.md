# Known Issues

## Connection Status Validation Bug

**Priority:** Low  
**Status:** ✅ **RESOLVED**  
**Date:** 2025-09-05  
**Version Affected:** 1.1.1 and earlier  
**Version Fixed:** 1.1.2  

### Problem Description

The ComfyUI connection status currently shows "connected" when only the HTTP URL is valid, even if the WebSocket URL is incorrect or unreachable. This creates a false positive where users believe their configuration is fully functional when it's only partially working.

### Current Behavior
- System tests HTTP URL (e.g., `http://localhost:8188`)
- If HTTP test passes, status shows "connected" 
- WebSocket URL (e.g., `ws://localhost:8188/ws`) is not validated
- Users may experience WebSocket connection failures during generation despite "connected" status

### Expected Behavior
Connection status should:
1. Test both HTTP and WebSocket URLs
2. Show "connected" only when BOTH are accessible
3. Display specific error messages indicating which connection failed:
   - "HTTP connection failed"
   - "WebSocket connection failed" 
   - "Both HTTP and WebSocket connections failed"

### Impact
- **User Experience:** Confusing false positives
- **Functionality:** Generation may fail unexpectedly due to WebSocket issues
- **Debugging:** Difficult to identify WebSocket-specific problems

### Reproduction Steps
1. Configure correct HTTP URL (e.g., `localhost:8188`)
2. Configure incorrect WebSocket URL (e.g., wrong port or path)
3. Observe connection status shows "connected"
4. Attempt generation - WebSocket connection will fail

### ✅ **Solution Implemented (v1.1.2)**
Updated connection validation logic in `client/src/stores/config.ts`:
- ✅ Implemented `testConnectionComprehensive()` function for parallel HTTP and WebSocket testing
- ✅ Connection status now reflects both test results with detailed error messaging
- ✅ Added comprehensive test button in Settings debug section
- ✅ Fixed server-side WebSocket route conflicts
- ✅ Only shows "connected" when both endpoints are verified

### Files Modified
- `client/src/stores/config.ts` - Added comprehensive connection testing
- `client/src/views/Settings/Settings.vue` - Added comprehensive test button and logic  
- `server/src/routes/comfyuiRouter.ts` - Fixed WebSocket route conflicts

### Workaround
Users can manually verify WebSocket connectivity by:
1. Testing generation workflow end-to-end
2. Checking browser DevTools console for WebSocket errors
3. Using external WebSocket testing tools

---

*This document tracks known issues in ComfyUIMini Enhanced. Issues are prioritized and addressed in future releases.*