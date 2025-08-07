<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import emitter from '../lib/mitt';
import { FiMenu } from 'vue-icons-plus/fi';

const sidebarOpened = ref(false);

function toggleSidebar() {
    sidebarOpened.value = !sidebarOpened.value;
}

const closeSidebar = () => sidebarOpened.value = false;

onMounted(() => {
    emitter.on('sidebar:close', closeSidebar);
});

onBeforeUnmount(() => {
    emitter.off('sidebar:close', closeSidebar);
});
</script>

<template>
    <div class="flex">
        <Sidebar :isOpened="sidebarOpened" />
    </div>

    <div
        v-if="sidebarOpened"
        class="fixed inset-0 bg-black/50 z-9 md:hidden"
        @click="sidebarOpened = false"    
    ></div>

    <div class="flex-1 min-h-screen pl-0 md:pl-64 transition-all duration-dynamic overflow-y-auto">
        <header class="p-1 bg-bg m-2 rounded-lg shadow flex flex-row items-center justify-between">
            <button @click="toggleSidebar" class="md:hidden hover:bg-bg-light aspect-square rounded-md p-2 cursor-pointer">
                <FiMenu />
            </button>
            <RouterLink to="/">
                <img src="/icons/favicon-256x256.png" alt="Home" class="size-9 hover:scale-95 active:scale-90 transition-all duration-dynamic"></img>
            </RouterLink>
            <span>v2.0.0</span>
        </header>
        <main class="px-2">
            <RouterView></RouterView>
        </main>
    </div>
</template>