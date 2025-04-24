<script setup lang="ts">
import { ref } from 'vue';
import { PiEye, PiEyeSlash, PiFilePlus } from 'vue-icons-plus/pi';
import { tryCatch } from '../../utils/tryCatch';
import { FaChevronDown, FaChevronUp, FaSave } from 'vue-icons-plus/fa';
import useAppWorkflowsStore from '../../stores/appWorkflows';
import router from '../../router';

const appWorkflowsStore = useAppWorkflowsStore();

const appWorkflow = ref<AppWorkflow>({
    title: 'New Workflow',
    description: '',
    inputs_info: [],
    nodes: {},
});

async function handleFileUpload(event: Event) {
    const uploadedFiles = (event.target as HTMLInputElement).files;

    const validatedFile = await validateFile(uploadedFiles);

    if (!validatedFile) {
        return;
    }

    appWorkflow.value.nodes = validatedFile;
    appWorkflow.value.inputs_info = generateDefaultInputsInfo(validatedFile);
}

async function validateFile(files: FileList | null): Promise<WorkflowNodes | null> {
    if (!files || files.length === 0) {
        alert('Please choose a file.');
        return null;
    } else if (files.length > 1) {
        alert('Please select only one file.');
        return null;
    }

    const fileExt = files[0].name.split('.').pop();
    if (fileExt !== 'json') {
        alert('Please select a JSON file.');
        return null;
    }

    const fileText = await files[0].text();
    const { data: parsedJson, error } = await tryCatch<Record<string, any>>(JSON.parse(fileText));
    if (error) {
        alert('Failed to parse JSON file.');
        return null;
    }

    if (parsedJson.hasOwnProperty('id')) {
        alert('Workflow not exported in API format.');
        return null;
    }

    // By here, we are 90% sure this is an api exported workflow, TODO: additional checks later
    return parsedJson as WorkflowNodes;
}

function generateDefaultInputsInfo(nodes: WorkflowNodes): AppWorkflowInputInfo[] {
    const inputsInfo: AppWorkflowInputInfo[] = [];

    for (const [nodeId, node] of Object.entries(nodes)) {
        for (const [inputName, input] of Object.entries(node.inputs)) {

            if (Array.isArray(input)) {
                // Arrays mean that the value is taken from another node, and is therefore not user editable
                continue;
            }

            if (typeof input === 'object') {
                console.warn('Found input with default as type object, skipping... Value: ', inputName, input);
                continue;
            }

            inputsInfo.push({
                node_id: nodeId,
                input_name: inputName,
                title: inputName,
                hidden: false,
            });
        }
    }

    return inputsInfo;
}

function handleSave() {
    appWorkflowsStore.addWorkflow(appWorkflow.value);
    router.push('/');
}

function moveUp(index: number) {
    const inputs = appWorkflow.value.inputs_info;

    if (index > 0) {
        [inputs[index - 1], inputs[index]] = [inputs[index], inputs[index - 1]];
    }
}

function moveDown(index: number) {
    const inputs = appWorkflow.value.inputs_info;

    if (index < inputs.length - 1) {
        [inputs[index + 1], inputs[index]] = [inputs[index], inputs[index + 1]];
    }
}
</script>

<template>
    <div class="size-full flex flex-col gap-2 overflow-y-auto">
        <RouterLink to="/" class="w-full bg-slate-800 text-white p-6 rounded-xl text-center text-lg cursor-pointer">
            Back
        </RouterLink>

        <input id="file-input" type="file" class="hidden" accept=".json" @change="handleFileUpload" />
        <label for="file-input"
            class="w-full flex flex-row items-center justify-center gap-2 p-4 bg-slate-700 text-white rounded-xl cursor-pointer">
            <PiFilePlus />
            Upload a workflow
        </label>

        <button v-if="appWorkflow.inputs_info.length > 0" @click="handleSave"
            class="bg-green-900 p-3 rounded-xl text-xl font-bold flex flex-row items-center justify-center gap-2 cursor-pointer">
            <FaSave />
            Save
        </button>

        <div class="flex flex-col gap-2" v-if="appWorkflow.inputs_info.length > 0">
            <span class="text-2xl font-bold">Info</span>
            <label for="workflow-title" class="text-white text-xl">Title</label>
            <input id="workflow-title" type="text" v-model="appWorkflow.title" class="bg-slate-700 p-3 rounded-xl"
                placeholder="New Workflow">

            <label for="workflow-description" class="text-white text-xl">Description</label>
            <textarea id="workflow-description" v-model="appWorkflow.description" class="bg-slate-700 p-3 rounded-xl"
                placeholder="This workflow does..."></textarea>

            <span class="text-2xl font-bold">Inputs</span>
            <div class="flex flex-col gap-2" role="list">
                <div v-for="(value, key) in appWorkflow.inputs_info" :key="key"
                    class="bg-slate-700 rounded-xl text-white flex flex-row" :class="{ 'opacity-75': value.hidden }"
                    role="listitem">

                    <div class="flex flex-col grow p-3 pr-0">
                        <span class="text-gray-300 italic mb-2">{{ value.input_name }}</span>
                        <div class="flex flex-row gap-2">
                            <input type="text" v-model="value.title"
                                class="text-white bg-slate-600 p-2 rounded-lg ring-1 ring-slate-400 font-semibold w-full text-lg">
                            <input :id="key + '_is_hidden'" type="checkbox" v-model="value.hidden" class="hidden">
                            <label :for="key + '_is_hidden'" class="*:p-2 *:box-content *:rounded-full">
                                <PiEyeSlash v-if="value.hidden" class="bg-slate-800" />
                                <PiEye v-else class="bg-slate-600" />
                            </label>
                        </div>

                        <input type="text" v-model="appWorkflow.nodes[value.node_id].inputs[value.input_name]"
                            class="bg-slate-600 p-3 mt-2 rounded-lg">
                    </div>
                    <div class="flex flex-col gap-2 ">
                        <FaChevronUp class="h-1/2 p-3 box-content" @click="moveUp(key)" />
                        <FaChevronDown class="h-1/2 p-3 box-content" @click="moveDown(key)" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>