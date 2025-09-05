# ComfyUIMini Rewrite Autocomplete - Roadmap

## Future Features

### URL History & Recent Connections
**Priority:** Medium  
**Estimated Effort:** 2-3 hours

Add a dropdown or history section to the URL configuration that remembers recently used ComfyUI URLs and connection endpoints. This would allow users to quickly switch between different ComfyUI instances (local, remote, different ports, etc.) without having to manually re-enter URLs.

**Features:**
- Store last 5-10 successfully connected URLs
- Quick selection dropdown in Settings
- Clear history option
- Persist history in localStorage alongside other config
- Show connection success timestamp for each saved URL

**Implementation Notes:**
- Extend the config store with `urlHistory: string[]`
- Add history management actions (addToHistory, clearHistory, removeFromHistory)
- Update Settings.vue with history dropdown component
- Only add URLs to history after successful connection test

---

## Completed Features

### Hybrid URL Configuration System ✅
- Auto-save for base URLs with debounced connection testing
- Manual save for custom URLs with validation
- Visual connection status indicators
- Non-blocking connection tests with error feedback

### Autocomplete Integration ✅
- Tag autocomplete with 5.7MB CSV dataset
- User preference for underscores vs spaces in tags
- Real-time suggestions in prompt fields
- Alias support and search matching

### Framework Unification ✅
- Converted from mixed Express/Hono to pure Hono
- Vue 3 + Composition API frontend
- Pinia state management with persistence
- TypeScript strict mode compliance