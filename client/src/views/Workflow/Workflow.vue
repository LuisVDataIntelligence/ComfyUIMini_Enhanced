<script setup lang="ts">
import { onBeforeMount, ref, toRaw } from 'vue';
import useAppWorkflowsStore from '../../stores/appWorkflows';
import router from '../../router';
import { useRoute } from 'vue-router';
import WorkflowInput from './components/WorkflowInput.vue';
import useComfyStore from '../../stores/comfyui';

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
        <button class="w-full p-4 bg-green-800 rounded-xl cursor-pointer" @click="generate">Generate</button>
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
        </div>
    </div>
</template>