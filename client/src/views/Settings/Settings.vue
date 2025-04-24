<script setup lang="ts">
import useConfigStore from '../../stores/config';
import TextSetting from './components/TextSetting.vue';

const configStore = useConfigStore();
</script>

<template>
    <div class="size-full flex flex-col">
        <RouterLink to="/" class="w-full bg-slate-800 text-white p-6 rounded-xl text-center text-lg cursor-pointer">
            Back
        </RouterLink>

        <h1 class="text-3xl font-bold mb-2">Settings</h1>

        <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-semibold">ComfyUI</h2>

            <TextSetting label="ComfyUI URL" v-model="configStore.comfyuiUrl" />
            <TextSetting label="ComfyUI Websocket URL" v-model="configStore.comfyuiWsUrl" />
        </div>
    </div>
</template>