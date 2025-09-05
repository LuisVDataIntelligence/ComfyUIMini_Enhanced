<script setup lang="ts">
import TextSetting from './components/TextSetting.vue';
import CheckboxSetting from './components/CheckboxSetting.vue';
import { useConfigStore } from '../../stores/config';
import SelectionSetting from './components/SelectionSetting.vue';
import ConnectionStatus from './components/ConnectionStatus.vue';
import CorsHelp from './components/CorsHelp.vue';
import { ref, watch, computed, onMounted } from 'vue';

const config = useConfigStore();
const isTesting = ref(false);

// Watch for changes to base URL and trigger debounced test
watch(() => config.comfyUi.urlConfig.base, (newValue, oldValue) => {
    if (config.debug.enabled) {
        console.log(`[DEBUG] Base URL changed from "${oldValue}" to "${newValue}"`);
        console.log(`[DEBUG] Generated URL: ${config.comfyUiUrl}`);
        console.log(`[DEBUG] Generated WS: ${config.comfyUiWs}`);
    }
    if (!config.comfyUi.urlConfig.custom) {
        config.testBaseUrlDebounced();
    }
}, { immediate: false });

watch(() => config.comfyUi.urlConfig.secure, (newValue, oldValue) => {
    if (config.debug.enabled) {
        console.log(`[DEBUG] Secure changed from ${oldValue} to ${newValue}`);
        console.log(`[DEBUG] Generated URL: ${config.comfyUiUrl}`);
        console.log(`[DEBUG] Generated WS: ${config.comfyUiWs}`);
    }
    if (!config.comfyUi.urlConfig.custom) {
        config.testBaseUrlDebounced();
    }
}, { immediate: false });

const testCustomUrls = async () => {
    if (isTesting.value) return;
    isTesting.value = true;
    try {
        await config.testCustomUrls();
    } finally {
        isTesting.value = false;
    }
};

// Check if we should show CORS help
const showCorsHelp = computed<boolean>(() => {
    const error = config.comfyUi.connectionStatus.lastError;
    return !!(error && error.includes('CORS'));
});

// Debug functions
const testBaseConnection = async () => {
    if (config.debug.enabled) {
        console.log('[DEBUG] Manual base connection test triggered');
        console.log(`[DEBUG] Testing URL: ${config.comfyUiUrl}`);
    }
    await config.testConnection('base');
};

const debugDumpConfig = () => {
    console.group('[DEBUG] Configuration Dump');
    console.log('Full config state:', JSON.stringify(config.$state, null, 2));
    console.log('Computed URLs:', {
        comfyUiUrl: config.comfyUiUrl,
        comfyUiWs: config.comfyUiWs
    });
    console.groupEnd();
};

// Load debug configuration from server on mount and trigger initial connection test
onMounted(async () => {
    await config.loadDebugConfig();
    
    // Trigger initial connection test for the current configuration
    if (!config.comfyUi.urlConfig.custom) {
        // For base URL configuration, test the base connection
        await config.testConnection('base');
    } else {
        // For custom URL configuration, test the custom connection
        await config.testConnection('custom');
    }
});
</script>

<template>
    <div class="size-full flex flex-col">
        <h1 class="text-3xl font-bold mb-2">Settings</h1>

        <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-semibold">ComfyUI URL</h2>
            
            <!-- URL Previews with Connection Status -->
            <div class="bg-bg-light p-3 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">HTTP URL:</span>
                    <ConnectionStatus 
                        :status="config.comfyUi.urlConfig.custom ? config.comfyUi.connectionStatus.custom : config.comfyUi.connectionStatus.base" 
                        :lastTested="config.comfyUi.connectionStatus.lastTested"
                        :error="config.comfyUi.connectionStatus.lastError"
                        :testUrl="config.comfyUiUrl"
                    />
                </div>
                <span class="text-text font-mono text-sm">{{ config.comfyUiUrl }}</span>
                
                <div class="mt-2 pt-2 border-t border-border-muted">
                    <span class="text-sm font-medium">WebSocket URL:</span>
                    <div class="text-text font-mono text-sm">{{ config.comfyUiWs }}</div>
                </div>
            </div>
            
            <!-- CORS Help -->
            <CorsHelp :show="showCorsHelp" />
            
            <TextSetting 
                label="Base ComfyUI URL" 
                v-model="config.comfyUi.urlConfig.base"
                placeholder="localhost:8188" 
            />
            <CheckboxSetting 
                label="Secure connection" 
                v-model="config.comfyUi.urlConfig.secure" 
            />
            <CheckboxSetting 
                label="Custom URLs" 
                v-model="config.comfyUi.urlConfig.custom" 
            />
            
            <div class="flex flex-col gap-2" v-if="config.comfyUi.urlConfig.custom">
                <TextSetting 
                    label="ComfyUI URL" 
                    v-model="config.comfyUi.urlConfig.customUrl" 
                />
                <TextSetting 
                    label="ComfyUI Websocket URL" 
                    v-model="config.comfyUi.urlConfig.customWs" 
                />
                <button 
                    @click="testCustomUrls"
                    :disabled="isTesting"
                    class="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors self-start"
                >
                    {{ isTesting ? 'Testing...' : 'Test Connection' }}
                </button>
            </div>
            <h2 class="text-2xl font-semibold">UI</h2>
            <CheckboxSetting label="UI Animations" v-model="config.ui.animations" />
            <SelectionSetting 
                label="Transition Speed" 
                :options="[[0, 'None (0ms)'], [75, 'Fast'], [125, 'Normal'], [175, 'Slow']]" 
                v-model="config.ui.transitionSpeedMs"
                @update:model-value="config.loadTransitionSpeed()"
             />
            <h2 class="text-2xl font-semibold">Autocomplete</h2>
            <CheckboxSetting 
                label="Use underscores in tags" 
                description="When enabled, tags use underscores (e.g. 'long_hair'). When disabled, spaces are used (e.g. 'long hair')."
                v-model="config.autocomplete.tagAutocomplete.useUnderscores" 
            />
            
            <!-- Debug Section (Server Controlled) -->
            <div v-if="config.debug.enabled" class="flex flex-col gap-2">
                <h2 class="text-2xl font-semibold">Debug</h2>
                
                <div class="flex flex-col gap-2 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-yellow-800">Debug Mode Active</h3>
                        <span class="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full uppercase">
                            {{ config.debug.buildType }}
                        </span>
                    </div>
                    
                    <div class="text-sm text-yellow-700 mb-2">
                        Debug mode is controlled by server configuration. Start server with <code class="bg-yellow-200 px-1 rounded">--debug</code> flag.
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 text-xs text-yellow-600">
                        <div>Connection Logs: {{ config.debug.showConnectionLogs ? '✓' : '✗' }}</div>
                        <div>Config Changes: {{ config.debug.showConfigChanges ? '✓' : '✗' }}</div>
                    </div>
                    
                    <div class="flex gap-2 flex-wrap mt-2">
                        <button 
                            @click="testBaseConnection"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Test Base Connection
                        </button>
                        
                        <button 
                            @click="debugDumpConfig"
                            class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Dump Config to Console
                        </button>
                        
                        <button 
                            @click="config.comfyUi.connectionStatus.base = 'idle'"
                            class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Reset Connection Status
                        </button>
                    </div>
                    
                    <div class="text-xs text-yellow-700 mt-2">
                        Open browser DevTools (F12) to see debug logs in the Console tab.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
