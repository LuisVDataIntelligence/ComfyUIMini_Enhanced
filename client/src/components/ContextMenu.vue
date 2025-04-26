<script setup lang="ts">
import { ref } from 'vue';

const opened = ref(false);
const openedLocation = ref({ x: 0, y: 0 });

function openMenu(e: MouseEvent) {
    if (opened.value) {
        opened.value = false;
        return;
    }

    opened.value = true;
    openedLocation.value = { x: e.clientX, y: e.clientY };

}

function closeMenu() {
    opened.value = false;
}

</script>

<template>
    <div v-click-outside="closeMenu">
        <slot name="button" :openMenu="(e: MouseEvent) => openMenu(e)"></slot>
        <div v-if="opened" class="bg-slate-600 p-2 rounded-xl size-48 absolute"
            :style="{ top: openedLocation.y + 'px', left: openedLocation.x + 'px' }">
        </div>
    </div>
</template>