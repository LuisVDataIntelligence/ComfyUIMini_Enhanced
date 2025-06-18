<script setup lang="ts">
import useConfigStore from '../../stores/config';
import TextSetting from './components/TextSetting.vue';
import CheckboxSetting from './components/CheckboxSetting.vue';
import { FaSave } from 'vue-icons-plus/fa';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';

const configStore = useConfigStore();

const clonedConfig = storeToRefs(configStore);

async function handleSave() {
    configStore.$patch({
        baseComfyuiUrl: clonedConfig.baseComfyuiUrl.value,
        comfyuiUseSecure: clonedConfig.comfyuiUseSecure.value,
        comfyuiUseCustomUrls: clonedConfig.comfyuiUseCustomUrls.value,
        comfyuiUrl: clonedConfig.comfyuiUrl.value,
        comfyuiWsUrl: clonedConfig.comfyuiWsUrl.value,
        animationsEnabled: clonedConfig.animationsEnabled.value,
    });

    location.reload();
}

watch(clonedConfig.baseComfyuiUrl, (newVal) => {
    if (clonedConfig.comfyuiUseCustomUrls.value) return;

    if (newVal === '') {
        newVal = 'localhost:8188';
    }
    const secure = clonedConfig.comfyuiUseSecure.value;

    clonedConfig.comfyuiUrl.value = `http${secure ? 's': ''}://${newVal}`;
    clonedConfig.comfyuiWsUrl.value = `ws${secure ? 's': ''}://${newVal}/ws`;
});

watch(clonedConfig.comfyuiUseSecure, (secure) => {
    if (clonedConfig.comfyuiUseCustomUrls.value) return;
    const url = clonedConfig.baseComfyuiUrl.value;

    clonedConfig.comfyuiUrl.value = `http${secure ? 's': ''}://${url}`;
    clonedConfig.comfyuiWsUrl.value = `ws${secure ? 's': ''}://${url}/ws`;
});

</script>

<template>
    <div class="size-full flex flex-col">
        <RouterLink to="/" class="w-full bg-slate-800 text-white p-6 rounded-xl text-center text-lg cursor-pointer">
            Back
        </RouterLink>
        <button @click="handleSave"
            class="mt-2 bg-green-900 p-3 rounded-xl text-xl font-bold flex flex-row items-center justify-center gap-2 cursor-pointer">
            <FaSave />
            Save
        </button>

        <h1 class="text-3xl font-bold mb-2">Settings</h1>

        <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-semibold">ComfyUI</h2>
            <TextSetting label="Base ComfyUI URL" v-model="clonedConfig.baseComfyuiUrl.value" placeholder="localhost:8188" />
            <CheckboxSetting label="Secure connection" v-model="clonedConfig.comfyuiUseSecure.value" />
            <CheckboxSetting label="Custom URLs" v-model="clonedConfig.comfyuiUseCustomUrls.value" />
            <div
                class="flex flex-col gap-2"
                :class="{
                    'opacity-50': !clonedConfig.comfyuiUseCustomUrls.value
                }">
                <TextSetting label="ComfyUI URL" :disabled="!clonedConfig.comfyuiUseCustomUrls.value" v-model="clonedConfig.comfyuiUrl.value" />
                <TextSetting label="ComfyUI Websocket URL" :disabled="!clonedConfig.comfyuiUseCustomUrls.value" v-model="clonedConfig.comfyuiWsUrl.value" />
            </div>
            <h2 class="text-2xl font-semibold">Animations</h2>
             <CheckboxSetting label="UI Animations" v-model="clonedConfig.animationsEnabled.value" />
        </div>
    </div>
</template>