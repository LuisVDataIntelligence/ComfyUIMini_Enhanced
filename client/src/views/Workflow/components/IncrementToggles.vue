<script setup lang="ts">
defineProps<{
    for: string;
    text: string;
    icon: string;
}>();
</script>

<template>
    <label :for
        class="p-2 rounded-md has-checked:bg-surface-light has-checked:font-semibold active:scale-105 transition-all duration-75 select-none w-full cursor-pointer">
        <div class="flex flex-col items-center justify-center">
            <span class="text-2xl">{{ icon }}</span>
            <span>{{ text }}</span>
        </div>
        <slot></slot>
    </label>
</template>