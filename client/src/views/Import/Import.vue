<script setup lang="ts">
import { onBeforeMount, ref, toRaw } from 'vue';
import { PiEye, PiEyeSlash, PiFilePlus } from 'vue-icons-plus/pi';
import { tryCatch } from '../../utils/tryCatch';
import { FaBars, FaChevronDown, FaChevronUp, FaFileExport, FaSave, FaTrash } from 'vue-icons-plus/fa';
import useAppWorkflowsStore from '../../stores/appWorkflows';
import router from '../../router';
import { useRoute } from 'vue-router';
import formatTextForFile from '../../utils/formatTextForFile';

const appWorkflowsStore = useAppWorkflowsStore();

const appWorkflow = ref<AppWorkflow>({
    title: 'New Workflow',
    description: '',
    inputs_info: [],
    nodes: {},
});

const params = useRoute().params;
const editing = ref(params.mode === 'edit');

const openedExtraMenus = ref<Set<number>>(new Set());

function toggleExtraMenu(index: number) {
    if (openedExtraMenus.value.has(index)) {
        openedExtraMenus.value.delete(index);
    } else {
        openedExtraMenus.value.add(index);
    }

    openedExtraMenus.value = new Set(openedExtraMenus.value);
}

onBeforeMount(() => {
    if (editing.value) {
        // Clone to prevent mutation before save
        appWorkflow.value = structuredClone(toRaw(appWorkflowsStore.appWorkflows[parseInt(params.index as string)]));
    }

    console.log("Opening: ", toRaw(appWorkflow.value));
});

async function handleFileUpload(event: Event) {
    const uploadedFiles = (event.target as HTMLInputElement).files;

    const validatedFile = await validateFile(uploadedFiles);

    if (!validatedFile) {
        return;
    }

    if (validatedFile.hasOwnProperty('title') &&
        validatedFile.hasOwnProperty('description') &&
        validatedFile.hasOwnProperty('inputs_info') &&
        validatedFile.hasOwnProperty('nodes')) {
        appWorkflow.value = validatedFile as AppWorkflow;
    } else {
        appWorkflow.value.nodes = validatedFile as WorkflowNodes;
        appWorkflow.value.inputs_info = generateDefaultInputsInfo(validatedFile as WorkflowNodes);
    }
}

async function validateFile(files: FileList | null): Promise<WorkflowNodes | AppWorkflow | null> {
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

    // By here, we are 70% sure this is an api exported workflow, TODO: additional checks later
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

            const inputInfoInitial: AppWorkflowInputInfo = {
                node_id: nodeId,
                input_name: inputName,
                title: inputName,
                hidden: false,
            };

            if (node.class_type === 'KSampler' && inputName === 'seed') {
                inputInfoInitial.features = {
                    increment_toggles: {
                        mode: 'random'
                    }
                }
            }

            inputsInfo.push(inputInfoInitial);
        }
    }

    return inputsInfo;
}

function handleSave() {
    if (editing.value) {
        appWorkflowsStore.editWorkflow(parseInt(params.index as string), appWorkflow.value);
    } else {
        appWorkflowsStore.addWorkflow(appWorkflow.value);
    }
    router.push('/');
}

function handleDelete() {
    if (!editing.value) {
        return;
    }

    if (!confirm(`Are you sure you want to delete workflow '${appWorkflow.value.title}'?`)) {
        return;
    }

    appWorkflowsStore.deleteWorkflow(parseInt(params.index as string));
    router.push('/');
}

function exportWorkflow() {
    const workflowCopy = structuredClone(toRaw(appWorkflow.value));
    workflowCopy.lastGeneratedImages = [];

    const json = JSON.stringify(workflowCopy, null, 4);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${formatTextForFile(workflowCopy.title)}.comfyminiworkflow.json`;
    a.click();

    URL.revokeObjectURL(url);
    a.remove();
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
            class="w-full flex flex-row items-center justify-center gap-2 p-4 bg-slate-700 text-white rounded-xl cursor-pointer"
            v-if="!editing">
            <PiFilePlus />
            Upload a workflow
        </label>

        <button v-if="appWorkflow.inputs_info.length > 0" @click="handleSave"
            class="bg-green-900 p-3 rounded-xl text-xl font-bold flex flex-row items-center justify-center gap-2 cursor-pointer">
            <FaSave />
            Save
        </button>

        <button v-if="appWorkflow.inputs_info.length > 0" @click="exportWorkflow"
            class="bg-slate-800 p-3 rounded-xl text-lg font-bold flex flex-row items-center justify-center gap-2 cursor-pointer">
            <FaFileExport class="size-5" />
            Export as JSON
        </button>

        <button v-if="editing" @click="handleDelete"
            class="bg-red-900 p-3 rounded-xl text-lg font-bold flex flex-row items-center justify-center gap-2 cursor-pointer">
            <FaTrash class="size-5" />
            Delete Workflow
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
                <div v-for="(value, index) in appWorkflow.inputs_info" :key="index"
                    class="bg-slate-700 rounded-xl text-white flex flex-row" :class="{ 'opacity-75': value.hidden }"
                    role="listitem">

                    <div class="flex flex-col grow p-3 pr-0">
                        <span class="text-gray-300 italic mb-2">{{ value.input_name }}</span>
                        <div class="flex flex-row gap-2 items-center">
                            <input type="text" v-model="value.title"
                                class="text-white bg-slate-600 p-2 rounded-lg ring-1 ring-slate-400 font-semibold w-full text-lg">

                            <button class="size-10 cursor-pointer rounded-full bg-slate-600"
                                @click="toggleExtraMenu(index)">
                                <FaBars class="box-content p-2" />
                            </button>
                            <input :id="index + '_is_hidden'" type="checkbox" v-model="value.hidden" class="hidden">
                            <label :for="index + '_is_hidden'"
                                class="*:p-2 *:box-content *:rounded-full cursor-pointer">
                                <PiEyeSlash v-if="value.hidden" class="bg-slate-800" />
                                <PiEye v-else class="bg-slate-600" />
                            </label>
                        </div>

                        <input type="text" v-model="appWorkflow.nodes[value.node_id].inputs[value.input_name]"
                            class="bg-slate-600 p-3 mt-2 rounded-lg">

                        <div v-if="openedExtraMenus.has(index)" class="w-full">
                            <div class="bg-slate-600 mt-2 p-2 rounded-lg">
                                <input :id="index + '_increment_toggles'" type="checkbox"
                                    :checked="value.features?.increment_toggles ? true : false || false" @change="e => {
                                        if (!value.features) value.features = {};
                                        const isChecked = (e.target as HTMLInputElement).checked;
                                        value.features.increment_toggles = isChecked ? { mode: 'random' } : undefined;
                                    }">
                                <label :for="index + '_increment_toggles'" class="ml-2">Random/Increment Toggle</label>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2 ">
                        <FaChevronUp class="h-1/2 p-3 box-content" @click="moveUp(index)" />
                        <FaChevronDown class="h-1/2 p-3 box-content" @click="moveDown(index)" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>