import { defineStore } from "pinia";

export type ConnectionStatus = 'connected' | 'failed' | 'testing' | 'pending' | 'idle';

interface Config {
    comfyUi: {
        urlConfig: {
            base: string;
            secure: boolean; // Use https/wss?
            custom: boolean; // Allow inputting custom urls for `url` and `ws`
            customUrl: string;
            customWs: string;
        },
        connectionStatus: {
            base: ConnectionStatus;
            custom: ConnectionStatus;
            lastTested: number | null;
            lastError: string | null;
        }
    },
    ui: {
        animations: boolean;
        transitionSpeedMs: number;
    },
    debug: {
        enabled: boolean;
        showConnectionLogs: boolean;
        showConfigChanges: boolean;
        buildType: 'development' | 'production' | 'debug';
    },
    autocomplete: {
        tagAutocomplete: {
            useUnderscores: boolean;
        }
    }
}

export const useConfigStore = defineStore('config', {
    state: (): Config => ({
        comfyUi: {
            urlConfig: {
                base: `${window.location.hostname}:49170`,
                secure: false,
                custom: false,
                customUrl: `http://${window.location.hostname}:8188`,
                customWs: `ws://${window.location.hostname}:8188/ws`
            },
            connectionStatus: {
                base: 'idle',
                custom: 'idle',
                lastTested: null,
                lastError: null
            }
        },
        ui: {
            animations: true,
            transitionSpeedMs: 125,
        },
        debug: {
            enabled: false,
            showConnectionLogs: false,
            showConfigChanges: false,
            buildType: 'production',
        },
        autocomplete: {
            tagAutocomplete: {
                useUnderscores: true, // Default to underscores for better model compatibility
            }
        },
    }),
    getters: {
        comfyUiUrl(state): string {
            const { base, secure, custom, customUrl } = state.comfyUi.urlConfig;
            if (custom && customUrl) return customUrl;

            // Remove any existing protocol from base URL
            const cleanBase = base.replace(/^(https?|wss?):\/\//, '');
            const protocol = secure ? 'https://' : 'http://';
            return `${protocol}${cleanBase}`;
        },
        comfyUiWs(state): string {
            const { base, secure, custom, customWs } = state.comfyUi.urlConfig;
            if (custom && customWs) return customWs;

            // Remove any existing protocol from base URL
            const cleanBase = base.replace(/^(https?|wss?):\/\//, '');
            const protocol = secure ? 'wss://' : 'ws://';
            return `${protocol}${cleanBase}/ws`;
        }
    },
    actions: {
        setTransitionSpeed(speed: number) {
            if (speed < 0) {
                throw new Error('Transition speed must be between 0 or more.');
            }

            console.log('Setting transition speed to', speed);
            this.ui.transitionSpeedMs = speed;

            this.loadTransitionSpeed();
        },
        loadTransitionSpeed() {
            if (this.ui.transitionSpeedMs == 0) {
                document.body.setAttribute('data-reduce-motion', '1');
                document.documentElement.style.setProperty('--transition-duration', '0s');
            } else {
                // set root attribute to the speed
                document.documentElement.style.setProperty('--transition-duration', `${this.ui.transitionSpeedMs}ms`);
                document.body.removeAttribute('data-reduce-motion');
            }
        },
        
        async testConnection(type: 'base' | 'custom'): Promise<boolean> {
            console.log(`[CONNECTION] Starting connection test for type: ${type}`);
            // Set testing status
            this.comfyUi.connectionStatus[type] = 'testing';
            this.comfyUi.connectionStatus.lastError = null;
            
            try {
                let url: string;
                if (type === 'base') {
                    url = this.comfyUiUrl;
                } else {
                    url = this.comfyUi.urlConfig.customUrl;
                }
                
                console.log(`[CONNECTION] Testing connection to: ${url} (debug enabled: ${this.debug.enabled})`);
                
                if (this.debug.enabled && this.debug.showConnectionLogs) {
                    console.log(`[DEBUG] Testing connection to: ${url}`);
                    console.log(`[DEBUG] Config state:`, {
                        base: this.comfyUi.urlConfig.base,
                        secure: this.comfyUi.urlConfig.secure,
                        custom: this.comfyUi.urlConfig.custom,
                        customUrl: this.comfyUi.urlConfig.customUrl
                    });
                }
                
                // Use server-side proxy for connection testing to avoid CORS issues
                const fetchPromise = fetch('/api/debug/test-connection', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url })
                });
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000);
                });
                
                const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
                
                if (this.debug.enabled && this.debug.showConnectionLogs) {
                    console.log(`[DEBUG] Response status: ${response.status}`);
                }
                
                // Parse the server proxy response
                if (response.ok) {
                    const result = await response.json();
                    
                    if (this.debug.enabled && this.debug.showConnectionLogs) {
                        console.log(`[DEBUG] Server proxy result:`, result);
                    }
                    
                    if (result.success) {
                        this.comfyUi.connectionStatus[type] = 'connected';
                        this.comfyUi.connectionStatus.lastTested = Date.now();
                        return true;
                    } else {
                        throw new Error(result.error || 'Connection failed');
                    }
                } else {
                    throw new Error(`Server proxy error: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                if (this.debug.enabled && this.debug.showConnectionLogs) {
                    console.error('[DEBUG] Connection test error:', error);
                }
                
                this.comfyUi.connectionStatus[type] = 'failed';
                
                // Provide better error messages
                if (error instanceof Error) {
                    if (error.message.includes('timeout')) {
                        this.comfyUi.connectionStatus.lastError = 'Connection timeout - ComfyUI may not be running';
                    } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
                        this.comfyUi.connectionStatus.lastError = 'CORS error - ComfyUI needs --enable-cors-header flag';
                    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                        this.comfyUi.connectionStatus.lastError = 'Network error - Check if ComfyUI is running and accessible';
                    } else {
                        this.comfyUi.connectionStatus.lastError = error.message;
                    }
                } else {
                    this.comfyUi.connectionStatus.lastError = 'Unknown connection error';
                }
                
                this.comfyUi.connectionStatus.lastTested = Date.now();
                return false;
            }
        },
        
        // Debounced connection test for auto-save scenarios
        _testBaseUrlTimeout: null as number | null,
        testBaseUrlDebounced() {
            if (this._testBaseUrlTimeout) {
                clearTimeout(this._testBaseUrlTimeout);
            }
            
            this.comfyUi.connectionStatus.base = 'pending';
            
            this._testBaseUrlTimeout = window.setTimeout(() => {
                this.testConnection('base');
            }, 1000); // 1 second delay
        },
        
        // Manual test for custom URLs
        async testCustomUrls(): Promise<boolean> {
            return await this.testConnection('custom');
        },

        // Fetch debug configuration from server
        async loadDebugConfig(): Promise<void> {
            console.log('[CONFIG] Attempting to load debug configuration from server...');
            try {
                const response = await fetch('/api/debug/config');
                if (response.ok) {
                    const debugConfig = await response.json();
                    console.log('[CONFIG] Server debug config received:', debugConfig);
                    
                    // Update debug configuration from server
                    this.debug.enabled = debugConfig.enabled;
                    this.debug.showConnectionLogs = debugConfig.showConnectionLogs;
                    this.debug.showConfigChanges = debugConfig.showConfigChanges;
                    this.debug.buildType = debugConfig.buildType;
                    
                    console.log('[CONFIG] Debug configuration loaded successfully - enabled:', this.debug.enabled);
                    if (this.debug.enabled) {
                        console.log('[DEBUG] Debug mode is now active with connection logs:', this.debug.showConnectionLogs);
                    }
                } else {
                    console.warn('[CONFIG] Failed to load debug configuration from server - response not ok:', response.status);
                }
            } catch (error) {
                console.warn('[CONFIG] Could not fetch debug configuration:', error);
                // Keep default (disabled) debug configuration
            }
        }
    },
    persist: {
        storage: localStorage,
        // Exclude debug config from persistence (server-controlled)
        omit: ['debug']
    }
});