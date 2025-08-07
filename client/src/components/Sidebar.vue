<script setup lang="ts">
import SidebarButton from './SidebarButton.vue';
import { FiFilePlus, FiHome, FiImage, FiSettings } from 'vue-icons-plus/fi';

defineProps<{
    isOpened: boolean;
}>();
</script>

<template>
    <aside class="flex flex-col fixed top-0 left-0 h-full w-64 bg-surface z-10 transform transition-transform duration-dynamic"
        :class="{ '-translate-x-full': !isOpened, 'translate-x-0': isOpened }">
        <SidebarButton text="Home" to="/" :icon="FiHome" class="mt-2" />
        
        <div class="grow"></div>
        <div class="flex flex-col gap-2 mb-2">
            <SidebarButton text="Import Workflow" to="/import" :icon="FiFilePlus" />
            <SidebarButton text="History" to="/history" :icon="FiImage" />
            <SidebarButton text="Settings" to="/settings" :icon="FiSettings" />
        </div>
    </aside>
</template>