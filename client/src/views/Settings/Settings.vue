<script setup lang="ts">
import TextSetting from './components/TextSetting.vue';
import CheckboxSetting from './components/CheckboxSetting.vue';
import { useConfigStore } from '../../stores/config';

const config = useConfigStore();
</script>

<template>
    <div class="size-full flex flex-col">
        <RouterLink to="/" class="w-full bg-slate-800 text-white p-6 rounded-xl text-center text-lg cursor-pointer">
            Back
        </RouterLink>

        <h1 class="text-3xl font-bold mb-2">Settings</h1>

        <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-semibold">ComfyUI</h2>
            <span>URL preview: {{ config.comfyUiUrl }}</span>
            <span>WS URL preview: {{ config.comfyUiWs }}</span>
            <TextSetting label="Base ComfyUI URL" v-model="config.comfyUi.urlConfig.base"
                placeholder="localhost:8188" />
            <CheckboxSetting label="Secure connection" v-model="config.comfyUi.urlConfig.secure" />
            <CheckboxSetting label="Custom URLs" v-model="config.comfyUi.urlConfig.custom" />
            <div class="flex flex-col gap-2" v-if="config.comfyUi.urlConfig.custom">
                <TextSetting label="ComfyUI URL" v-model="config.comfyUi.urlConfig.customUrl" />
                <TextSetting label="ComfyUI Websocket URL" v-model="config.comfyUi.urlConfig.customWs" />
            </div>
            <h2 class="text-2xl font-semibold">Animations</h2>
            <CheckboxSetting label="UI Animations" v-model="config.ui.animations" />
        </div>
    </div>
</template>