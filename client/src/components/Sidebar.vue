<script setup lang="ts">
import { FaFileImport, FaHistory, FaHome } from 'vue-icons-plus/fa';
import SidebarButton from './SidebarButton.vue';
import { LuSettings } from 'vue-icons-plus/lu';

defineProps<{
    isOpened: boolean;
}>();
</script>

<template>
    <aside class="flex flex-col fixed top-0 left-0 h-full w-64 bg-surface z-10 transform transition-transform duration-dynamic"
        :class="{ '-translate-x-full': !isOpened, 'translate-x-0': isOpened }">
        <SidebarButton text="Home" to="/" :icon="FaHome" class="mt-2" />
        
        <div class="grow"></div>
        <div class="flex flex-col gap-2 mb-2">
            <SidebarButton text="Import Workflow" to="/import" :icon="FaFileImport" />
            <SidebarButton text="History" to="/history" :icon="FaHistory" />
            <SidebarButton text="Settings" to="/settings" :icon="LuSettings" />
        </div>
    </aside>
</template>