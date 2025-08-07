<script setup lang="ts">
import type { IconType } from 'vue-icons-plus';
import emitter from '../lib/mitt';

defineProps<{
    text: string;
    to: string;
    icon: IconType;
}>();

function onClick() {
    emitter.emit('sidebar:close');
}
</script>

<template>
    <RouterLink :to @click="onClick">
        <button class="w-full flex flex-row items-center justify-center gap-2 bg-surface-light p-4 mx-2 max-w-60 rounded-md cursor-pointer hover:text-text active:text-text active:scale-95 transition-all duration-dynamic">
            <component :is="icon" />
            {{ text }}
        </button>
    </RouterLink>
</template>