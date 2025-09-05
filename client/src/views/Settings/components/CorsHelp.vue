<script setup lang="ts">
defineProps<{
    show: boolean;
}>();
</script>

<template>
    <div v-if="show" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-2">
        <div class="flex items-start gap-3">
            <span class="text-yellow-600 text-xl">⚠️</span>
            <div class="flex-1">
                <h3 class="text-yellow-800 font-semibold mb-2">CORS Configuration Needed</h3>
                <p class="text-yellow-700 text-sm mb-3">
                    ComfyUI needs to be started with CORS headers to allow browser connections from this interface.
                </p>
                <div class="bg-yellow-100 border border-yellow-300 rounded p-3 mb-3">
                    <p class="text-yellow-800 text-sm font-mono">
                        python main.py --enable-cors-header
                    </p>
                </div>
                <p class="text-yellow-700 text-xs">
                    Restart ComfyUI with this flag to enable cross-origin requests. This allows the web interface to communicate with ComfyUI.
                </p>
            </div>
        </div>
    </div>
</template>