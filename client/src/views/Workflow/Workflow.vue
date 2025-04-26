<script setup lang="ts">
import { onBeforeMount, ref, toRaw } from 'vue';
import useAppWorkflowsStore from '../../stores/appWorkflows';
import router from '../../router';
import { useRoute } from 'vue-router';
import WorkflowInput from './components/WorkflowInput.vue';
import useComfyStore from '../../stores/comfyui';
import { FaHistory, FaPlay, FaStop } from 'vue-icons-plus/fa';

const comfyuiStore = useComfyStore();
const appWorkflowsStore = useAppWorkflowsStore();
const openedWorkflow = ref<AppWorkflow>({
    title: 'Loading...',
    description: '',
    inputs_info: [],
    nodes: {},
});

const inputs = ref([]);

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

async function generate() {
    console.log('Generating...');

    const workflowCopy = structuredClone(toRaw(openedWorkflow.value));

    inputs.value.map((inputComponent: InstanceType<typeof WorkflowInput>) => {
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
    <div class="size-full flex flex-col gap-2 overflow-y-auto">
        <RouterLink to="/" class="w-full bg-slate-800 text-white p-6 rounded-xl text-center text-lg cursor-pointer">
            Back
        </RouterLink>
        <div class="flex flex-col gap-2">
            <WorkflowInput v-for="(input, index) in openedWorkflow.inputs_info" :key="index" :input="input"
                :node="openedWorkflow.nodes[input.node_id]" ref="inputs" />
        </div>
        <div class="flex flex-col gap-2">
            <div class="w-full h-8 bg-slate-900 rounded-xl">
                <div class="h-full bg-blue-700 rounded-xl" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <div v-if="displayImageUrls.length === 0"
                class="bg-gradient-to-br from-slate-700 to-slate-800 w-full aspect-square"></div>
            <div v-else class="flex flex-col gap-2 w-full">
                <a v-for="(imageUrl, index) in displayImageUrls" :key="index" :href="imageUrl" target="_blank"
                    class="w-full">
                    <img :src="imageUrl" class="w-full" />
                </a>
            </div>
            <RouterLink to="/history"
                class="bg-slate-800 p-4 rounded-xl text-lg cursor-pointer flex flex-row gap-2 items-center justify-center">
                <FaHistory class="size-5" />
                View History
            </RouterLink>
        </div>
        <div class="size-14 fixed bottom-0 right-22 m-2 rounded-full shadow-xs shadow-black">
            <div class="size-full bg-slate-950 rounded-full opacity-85"
                :class="{ '!bg-red-600 !opacity-100': comfyuiStore.queue.queue_running.length > 0 }"
                @click="stopGeneration">
                <FaStop class="size-full p-4" />
            </div>
        </div>
        <div class="size-20 fixed bottom-0 right-0 m-2 overflow-hidden rounded-full shadow-sm shadow-black"
            role="button">
            <div class="absolute rounded-full size-full bg-conic from-white from-50% to-black to-50% invisible"
                :class="{ 'animate-spin visible': comfyuiStore.queue.queue_running.length > 0 }">
            </div>
            <button class="absolute size-full bg-blue-600 rounded-full cursor-pointer transition-all duration-300"
                :class="{ 'scale-90 bg-blue-500': comfyuiStore.queue.queue_running.length > 0 }" @click="generate">
                <FaPlay class="size-full py-6 pl-1" />
            </button>
        </div>
        <div class="h-20 min-h-20"></div>
    </div>
</template>