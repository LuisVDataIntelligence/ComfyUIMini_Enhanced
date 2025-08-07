<script setup lang="ts">
import type { IconType } from 'vue-icons-plus';

defineProps<{
    text: string;
    icon: IconType;
}>();
</script>

<template>
    <button class="text-bg-light p-3 rounded-lg flex flex-row items-center justify-center gap-2 cursor-pointer">
        <component :is="icon" class="size-5" />
        {{ text }}
    </button>
</template>