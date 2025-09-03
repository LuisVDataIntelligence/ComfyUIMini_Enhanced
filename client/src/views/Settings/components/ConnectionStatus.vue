<script setup lang="ts">
import type { ConnectionStatus } from '../../../stores/config.js';

defineProps<{
    status: ConnectionStatus;
    lastTested?: number | null;
    error?: string | null;
    testUrl?: string;
}>();

const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
        case 'connected': return '✅';
        case 'failed': return '❌';
        case 'testing': return '🔄';
        case 'pending': return '🕐';
        default: return '⚪';
    }
};

const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
        case 'connected': return 'Connected';
        case 'failed': return 'Failed';
        case 'testing': return 'Testing...';
        case 'pending': return 'Pending test';
        default: return 'Not tested';
    }
};

const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
        case 'connected': return 'text-green-400';
        case 'failed': return 'text-red-400';
        case 'testing': return 'text-blue-400';
        case 'pending': return 'text-yellow-400';
        default: return 'text-text-muted';
    }
};

const formatLastTested = (timestamp: number | null | undefined) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return new Date(timestamp).toLocaleTimeString();
};
</script>

<template>
    <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2 text-sm">
            <span class="text-lg">{{ getStatusIcon(status) }}</span>
            <span :class="getStatusColor(status)">{{ getStatusText(status) }}</span>
            <span v-if="lastTested && status !== 'testing'" class="text-text-muted">
                ({{ formatLastTested(lastTested) }})
            </span>
        </div>
        <div v-if="status === 'failed' && error" class="text-red-400 text-xs">
            {{ error }}
        </div>
    </div>
</template>