<script setup lang="ts">
import { onBeforeMount, ref, toRaw, onMounted, nextTick } from 'vue';
import useAppWorkflowsStore from '../../stores/appWorkflows';
import router from '../../lib/router';
import { useRoute } from 'vue-router';
import WorkflowInput from './components/WorkflowInput.vue';
import useComfyStore from '../../stores/comfyui';
import { FaEdit, FaHistory, FaPlay, FaStop } from 'vue-icons-plus/fa';

const comfyuiStore = useComfyStore();
const appWorkflowsStore = useAppWorkflowsStore();
const openedWorkflow = ref<AppWorkflow>({
    title: 'Loading...',
    description: '',
    inputs_info: [],
    nodes: {},
});

const inputElems = ref([]);

const progressPercent = ref(0);
const displayImageUrls = ref<string[]>([]);

onBeforeMount(() => {
    const workflowIndex = parseInt(useRoute().params.index as string);
    if (workflowIndex >= appWorkflowsStore.appWorkflows.length || isNaN(workflowIndex)) {
        router.push('/');
    }

    openedWorkflow.value = appWorkflowsStore.appWorkflows[workflowIndex];
    displayImageUrls.value = openedWorkflow.value.lastGeneratedImages ?? [];
});

onMounted(async () => {
    // Wait for DOM to render inputs
    await nextTick();
    // Note: Tag autocomplete functionality removed for now
    // const textareas = document.querySelectorAll('textarea.has-tag-autocomplete');
    // textareas.forEach((el) => {
    //     // Autocomplete attachment would go here
    // });
});

async function generate() {
    console.log('Generating...');

    const workflowCopy = structuredClone(toRaw(openedWorkflow.value));

    inputElems.value.map((inputComponent: InstanceType<typeof WorkflowInput>) => {
        const inputData = inputComponent.getValue();

        if (inputData.value === undefined) {
            return;
        }

        const inputInfo = openedWorkflow.value.inputs_info.find((inputInfo) => {
            return inputInfo.node_id === inputData.nodeId && inputInfo.input_name === inputData.inputName;
        });

        if (inputInfo) {
            inputInfo.lastValue = inputData.value;
        }

        workflowCopy.nodes[inputData.nodeId].inputs[inputData.inputName] = inputData.value;
    });

    const toSendToComfyUI = workflowCopy.nodes;
    for await (const chunk of comfyuiStore.generate(toSendToComfyUI)) {
        if (chunk.type === 'progress') {
            progressPercent.value = (chunk.data.value / chunk.data.total) * 100;
        } else if (chunk.type === 'preview') {
            displayImageUrls.value = [chunk.data.image];
        } else if (chunk.type === 'status') {
            console.log("Queue left:", chunk.data.queue_remaining);
        } else if (chunk.type === 'finished') {
            displayImageUrls.value = chunk.data.images;
            openedWorkflow.value.lastGeneratedImages = chunk.data.images;
        }
    }
}

async function stopGeneration() {
    console.log('Stopping generation...');

    comfyuiStore.stopGeneration();
}
</script>

<template>
    <div v-if="!comfyuiStore.loading && !comfyuiStore.connected"
        class="absolute top-0 left-0 size-full flex items-center justify-center">
        <div class="max-w-[90vw] min-w-96 w-full bg-surface p-4 rounded-lg flex flex-col gap-2">
            <span class="font-semibold text-xl">Could not connect to ComfyUI</span>
            <p>Please ensure ComfyUI is setup correctly by enabling CORS for this URL or ensure that the URL entered in
                app settings is correct.</p>
            <div class="flex flex-row justify-between">
                <RouterLink to="/settings" class="bg-surface-light p-2 pointer-coarse:p-4 rounded-md max-w-fit">Settings
                </RouterLink>
                <button class="bg-surface-light p-2 pointer-coarse:p-4 rounded-md max-w-fit cursor-pointer"
                    @click="router.back()">Back</button>
            </div>
        </div>
    </div>
    <div v-else class="size-full flex flex-col md:flex-row gap-2 overflow-y-auto md:overflow-y-hidden md:h-[calc(100dvh-1rem)]">
        <div class="flex flex-col gap-2 md:w-1/2 md:overflow-y-auto">
            <div v-for="input in openedWorkflow.inputs_info.filter(input => !input.hidden)"
                :key="`${input.node_id}${input.input_name}`">
                <WorkflowInput :input="input" :node="openedWorkflow.nodes[input.node_id]" ref="inputElems" />
            </div>
        </div>
        <div class="flex flex-col gap-2 md:w-1/2 md:overflow-y-auto">
            <div class="relative w-full h-8 bg-bg rounded-lg ring-1 ring-text/50 ring-inset">
                <div class="h-full bg-blue-700 rounded-lg transition-all duration-100"
                    :style="{ width: progressPercent + '%' }"></div>
                <span class="absolute top-0 left-0 text-2xl h-8 pl-2 items-center justify-center flex font-semibold text-text">{{
                    Math.floor(progressPercent)
                }}%</span>
            </div>
            <div v-if="displayImageUrls.length === 0"
                class="bg-gradient-to-br from-surface to-bg-light w-full aspect-square"></div>
            <div v-else class="flex flex-col gap-2 w-full">
                <a v-for="(imageUrl, index) in displayImageUrls" :key="index" :href="imageUrl" target="_blank"
                    class="w-full">
                    <img :src="imageUrl" class="w-full" />
                </a>
            </div>
            <RouterLink to="/history"
                class="bg-surface p-4 rounded-xl text-lg cursor-pointer flex flex-row gap-2 items-center justify-center">
                <FaHistory class="size-5" />
                View History
            </RouterLink>
        </div>
        <div class="size-14 fixed bg-bg-dark opacity-85 bottom-0 left-0 m-2 rounded-full shadow-xs shadow-black md:hidden">
            <RouterLink :to="router.currentRoute.value.fullPath + '/edit'" class="size-full rounded-full">
                <FaEdit class="size-full p-4 pr-3" />
            </RouterLink>
        </div>
        <div class="size-14 fixed bottom-0 right-22 m-2 rounded-full shadow-xs shadow-black">
            <div class="size-full bg-bg-dark rounded-full opacity-85"
                :class="{ '!bg-red-600 !opacity-100': comfyuiStore.queue.queue_running.length > 0 }"
                @click="stopGeneration">
                <FaStop class="size-full p-4 text-txet" />
            </div>
        </div>
        <div class="size-20 fixed bottom-0 right-0 m-2 overflow-hidden rounded-full shadow-sm shadow-black"
            role="button">
            <div class="absolute rounded-full size-full bg-conic from-white from-50% to-black to-50% invisible"
                :class="{ 'animate-spin visible': comfyuiStore.queue.queue_running.length > 0 }">
            </div>
            <button class="absolute size-full bg-blue-600 rounded-full cursor-pointer transition-all duration-300 text-text"
                :class="{ 'scale-90 bg-blue-500': comfyuiStore.queue.queue_running.length > 0 }" @click="generate">
                <FaPlay class="size-full py-6 pl-1" />
            </button>
        </div>
        <div class="h-20 min-h-20 md:hidden"></div>
    </div>
</template>