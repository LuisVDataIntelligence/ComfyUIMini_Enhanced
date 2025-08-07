<script setup lang="ts">
import { onBeforeMount, ref, toRaw } from 'vue';
import { tryCatch } from '../../utils/tryCatch';
import useAppWorkflowsStore from '../../stores/appWorkflows';
import router from '../../lib/router';
import { useRoute } from 'vue-router';
import formatTextForFile from '../../utils/formatTextForFile';
import { VueDraggableNext } from 'vue-draggable-next';
import { FiDownload, FiEye, FiEyeOff, FiFilePlus, FiMinus, FiPlus, FiSave, FiTrash2 } from 'vue-icons-plus/fi';
import ActionButton from './ActionButton.vue';

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

            if (node.class_type === 'CLIPTextEncode' && inputName === 'text') {
                inputInfoInitial.features = {
                    tag_input: true
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
</script>

<template>
    <div class="size-full flex flex-col gap-2 overflow-y-auto">
        <input id="file-input" type="file" class="hidden" accept=".json" @change="handleFileUpload" />
        <label for="file-input"
            class="w-full flex flex-row items-center justify-center gap-2 p-4 bg-bg-light text-text rounded-lg cursor-pointer"
            v-if="!editing">
            <FiFilePlus />
            Upload a workflow
        </label>

        <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-semibold" v-if="editing">Actions</h2>

            <ActionButton 
                v-if="appWorkflow.inputs_info.length > 0" 
                class="bg-success" 
                text="Save" 
                :icon="FiSave" 
                @click="handleSave" 
            />

            <ActionButton 
                v-if="appWorkflow.inputs_info.length > 0" 
                class="bg-info" 
                text="Export as JSON" 
                :icon="FiDownload" 
                @click="exportWorkflow" 
            />

            <ActionButton 
                v-if="editing" 
                class="bg-danger" 
                text="Delete Workflow" 
                :icon="FiTrash2" 
                @click="handleDelete" 
            />
        </div>

        <div class="flex flex-col gap-2" v-if="appWorkflow.inputs_info.length > 0">
            <h2 class="text-2xl font-semibold">Properties</h2>
            <label for="workflow-title" class="text-text font-medium text-lg">Title</label>
            <input id="workflow-title" type="text" v-model="appWorkflow.title" class="bg-bg-light p-3 rounded-xl"
                placeholder="New Workflow">

            <label for="workflow-description" class="text-text font-medium text-lg">Description</label>
            <textarea id="workflow-description" v-model="appWorkflow.description" class="bg-bg-light p-3 rounded-xl"
                placeholder="This workflow does..."></textarea>

            <h2 class="text-2xl font-semibold">Inputs</h2>
            <VueDraggableNext v-model="appWorkflow.inputs_info" class="flex flex-col gap-2" delay="300">
                <div v-for="(value, index) in appWorkflow.inputs_info" :key="`${value.node_id}${value.input_name}`"
                    :class="{ 'opacity-75': value.hidden }" role="listitem">

                    <div class="flex flex-col grow p-3 gap-2 bg-bg rounded-xl input-draggable-content">
                        <span class="italic">{{ value.input_name }}</span>
                        <div class="flex flex-row gap-2 items-center">
                            <input type="text" v-model="value.title"
                                class="bg-bg-light text-text p-2 rounded-lg ring-1 ring-border font-semibold w-full text-lg">

                            <button class="size-10 cursor-pointer rounded-full bg-bg-light text-text"
                                @click="toggleExtraMenu(index)" role="button" title="More options">
                                <component :is="openedExtraMenus.has(index) ? FiMinus : FiPlus" class="box-content p-2" />
                            </button>
                            <input :id="index + '_is_hidden'" type="checkbox" v-model="value.hidden" class="sr-only">
                            <label :for="index + '_is_hidden'" class="*:p-2 *:box-content *:rounded-full cursor-pointer text-text"
                                role="button" title="Hide input">
                                <FiEyeOff v-if="value.hidden" class="bg-bg-light" />
                                <FiEye v-else class="bg-bg-light" />
                            </label>
                        </div>

                        <input type="text" v-model="appWorkflow.nodes[value.node_id].inputs[value.input_name]"
                            class="bg-bg-light p-3 rounded-lg">

                        <div v-if="openedExtraMenus.has(index)" class="w-full">
                            <div class="bg-bg-light p-2 rounded-lg">
                                <div>
                                    <input :id="index + '_increment_toggles'" type="checkbox"
                                        :checked="value.features?.increment_toggles ? true : false || false" @change="e => {
                                            if (!value.features) value.features = {};
                                            const isChecked = (e.target as HTMLInputElement).checked;
                                            value.features.increment_toggles = isChecked ? { mode: 'random' } : undefined;
                                        }">
                                    <label :for="index + '_increment_toggles'" class="ml-2">Random/Increment
                                        Toggle</label>
                                </div>

                                <div>
                                    <input :id="index + '_tag_input'" type="checkbox"
                                        :checked="value.features?.tag_input ? true : false || false" @change="e => {
                                            if (!value.features) value.features = {};
                                            const isChecked = (e.target as HTMLInputElement).checked;
                                            value.features.tag_input = isChecked;
                                        }">
                                    <label :for="index + '_tag_input'" class="ml-2">Tag Input</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </VueDraggableNext>
        </div>
    </div>
</template>