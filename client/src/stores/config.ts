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
                
                if (this.debug.enabled && this.debug.showConnectionLogs) {
                    console.log(`[DEBUG] Testing connection to: ${url}`);
                    console.log(`[DEBUG] Config state:`, {
                        base: this.comfyUi.urlConfig.base,
                        secure: this.comfyUi.urlConfig.secure,
                        custom: this.comfyUi.urlConfig.custom,
                        customUrl: this.comfyUi.urlConfig.customUrl
                    });
                }
                
                // Use Promise.race for timeout instead of AbortController
                const fetchPromise = fetch(`${url}/`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/json,*/*'
                    }
                });
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000);
                });
                
                const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
                
                if (this.debug.enabled && this.debug.showConnectionLogs) {
                    console.log(`[DEBUG] Response status: ${response.status}`);
                }
                
                // ComfyUI root endpoint should return something (even if 200, 404, etc.)
                if (response.status < 500) { // Accept any non-server-error response
                    this.comfyUi.connectionStatus[type] = 'connected';
                    this.comfyUi.connectionStatus.lastTested = Date.now();
                    return true;
                } else {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
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
            try {
                const response = await fetch('/api/debug/config');
                if (response.ok) {
                    const debugConfig = await response.json();
                    
                    // Update debug configuration from server
                    this.debug.enabled = debugConfig.enabled;
                    this.debug.showConnectionLogs = debugConfig.showConnectionLogs;
                    this.debug.showConfigChanges = debugConfig.showConfigChanges;
                    this.debug.buildType = debugConfig.buildType;
                    
                    if (this.debug.enabled) {
                        console.log('[DEBUG] Debug configuration loaded from server:', debugConfig);
                    }
                } else {
                    console.warn('Failed to load debug configuration from server');
                }
            } catch (error) {
                console.warn('Could not fetch debug configuration:', error);
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