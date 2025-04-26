<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import useComfyStore from '../../stores/comfyui';
import imageDataToUrl from '../../utils/imageDataToUrl';

const comfyuiStore = useComfyStore();

const metadataHidden = ref(true);

onMounted(() => {
    comfyuiStore.loadFullHistory();
});

const historyReversed = computed(() => {
    const history = comfyuiStore.history;

    return Object.entries(history).reverse().map(([key, value]) => ({
        id: key,
        prompt: value
    }));
});
</script>

<template>
    <div class="size-full overflow-y-auto flex flex-col gap-2">
        <div @click.stop="$router.go(-1)"
            class="w-full bg-slate-800 text-white p-6 rounded-xl text-center text-lg cursor-pointer">
            Back
        </div>
        <div class="w-full bg-slate-700 p-4 rounded-xl text-center cursor-pointer"
            @click="metadataHidden = !metadataHidden">
            {{ metadataHidden ? 'Show' : 'Hide' }} metadata
        </div>

        <div class="flex flex-col gap-2">
            <div v-for="prompt in historyReversed" :key="prompt.id" class="bg-slate-800 p-2 rounded-xl"
                :class="{ '!p-0 bg-transparent': metadataHidden }">
                <span class="text-gray-300" v-if="!metadataHidden">Prompt ID: <span class="italic">{{ prompt.id
                }}</span></span>
                <div v-for="(outputNodeImages, outputNode) of prompt.prompt.outputs" :key="outputNode"
                    class="bg-slate-700 p-2 rounded-lg">
                    <span class="font-bold pb-2" v-if="!metadataHidden">Node: {{ outputNode }}</span>
                    <div class="flex flex-col gap-2">
                        <img v-for="image of outputNodeImages.images"
                            :src="imageDataToUrl(comfyuiStore.comfyuiUrl, image)" loading="lazy" class="w-full"
                            alt="Generated Image">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>