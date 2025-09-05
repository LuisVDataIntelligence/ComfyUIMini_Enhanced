<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import useComfyStore from '../../stores/comfyui';
import { FaPlay, FaStop } from 'vue-icons-plus/fa';
import { promptAutocompleteManager } from '../../lib/promptAutocompleteManager';

const comfyuiStore = useComfyStore();

// Generation parameters
const positivePrompt = ref('a beautiful landscape, detailed, high quality');
const negativePrompt = ref('blurry, low quality, distorted');
const width = ref(512);
const height = ref(512);
const cfgScale = ref(7.0);
const steps = ref(20);
const seed = ref(-1);
const sampler = ref('euler');
const scheduler = ref('normal');
const modelName = ref('');

// Get available checkpoints from ComfyUI
const availableCheckpoints = computed(() => {
    if (!comfyuiStore.objectInfo?.CheckpointLoaderSimple) return [];
    const checkpointInfo = comfyuiStore.objectInfo.CheckpointLoaderSimple;
    return checkpointInfo.input?.required?.ckpt_name?.[0] || [];
});

// Get available samplers from ComfyUI
const availableSamplers = computed(() => {
    if (!comfyuiStore.objectInfo?.KSampler) return ['euler'];
    const samplerInfo = comfyuiStore.objectInfo.KSampler;
    return samplerInfo.input?.required?.sampler_name?.[0] || ['euler'];
});

// Get available schedulers from ComfyUI
const availableSchedulers = computed(() => {
    if (!comfyuiStore.objectInfo?.KSampler) return ['normal'];
    const schedulerInfo = comfyuiStore.objectInfo.KSampler;
    return schedulerInfo.input?.required?.scheduler?.[0] || ['normal'];
});

// Initialize with first available options
onMounted(() => {
    console.log('Generate component mounted');
    console.log('ComfyUI URL:', comfyuiStore.comfyuiUrl);
    console.log('ComfyUI store connected:', comfyuiStore.connected);
    console.log('ComfyUI store loading:', comfyuiStore.loading);
    console.log('ComfyUI object_info:', comfyuiStore.objectInfo);
    console.log('Available checkpoints:', availableCheckpoints.value);
    console.log('Available samplers:', availableSamplers.value);
    console.log('Available schedulers:', availableSchedulers.value);
    
    if (availableCheckpoints.value.length > 0 && !modelName.value) {
        modelName.value = availableCheckpoints.value[0];
    }
    if (availableSamplers.value.length > 0 && !sampler.value) {
        sampler.value = availableSamplers.value[0];
    }
    if (availableSchedulers.value.length > 0 && !scheduler.value) {
        scheduler.value = availableSchedulers.value[0];
    }
});

// Setup autocomplete for prompt textareas
onMounted(async () => {
    // Wait for DOM to render
    await nextTick();
    
    // Setup autocomplete for textareas with has-tag-autocomplete class
    const textareas = document.querySelectorAll('textarea.has-tag-autocomplete');
    textareas.forEach((textarea) => {
        const inputElement = textarea as HTMLTextAreaElement;
        const inputTitle = inputElement.getAttribute('title') || inputElement.placeholder || 'prompt';
        promptAutocompleteManager.attachToTextarea(inputElement, inputTitle);
    });
});

// Image generation state
const progressPercent = ref(0);
const displayImageUrls = ref<string[]>([]);

// Build ComfyUI workflow from parameters
function buildWorkflow(): WorkflowNodes {
    return {
        "1": {
            "_meta": { "title": "Load Checkpoint" },
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": modelName.value
            }
        },
        "2": {
            "_meta": { "title": "Positive Prompt" },
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": positivePrompt.value,
                "clip": ["1", 1]
            }
        },
        "3": {
            "_meta": { "title": "Negative Prompt" },
            "class_type": "CLIPTextEncode", 
            "inputs": {
                "text": negativePrompt.value,
                "clip": ["1", 1]
            }
        },
        "4": {
            "_meta": { "title": "Empty Latent" },
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": width.value,
                "height": height.value,
                "batch_size": 1
            }
        },
        "5": {
            "_meta": { "title": "KSampler" },
            "class_type": "KSampler",
            "inputs": {
                "seed": seed.value === -1 ? Math.floor(Math.random() * 1000000) : seed.value,
                "steps": steps.value,
                "cfg": cfgScale.value,
                "sampler_name": sampler.value,
                "scheduler": scheduler.value,
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0]
            }
        },
        "6": {
            "_meta": { "title": "VAE Decode" },
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["5", 0],
                "vae": ["1", 2]
            }
        },
        "7": {
            "_meta": { "title": "Save Image" },
            "class_type": "SaveImage",
            "inputs": {
                "images": ["6", 0],
                "filename_prefix": "ComfyMini"
            }
        }
    };
}

async function generate() {
    console.log('Generating with direct parameters...');
    console.log('Parameters:', {
        positivePrompt: positivePrompt.value,
        negativePrompt: negativePrompt.value,
        width: width.value,
        height: height.value,
        steps: steps.value,
        cfgScale: cfgScale.value,
        sampler: sampler.value,
        scheduler: scheduler.value,
        seed: seed.value,
        modelName: modelName.value
    });
    
    const workflow = buildWorkflow();
    console.log('Built workflow:', workflow);
    
    try {
        for await (const chunk of comfyuiStore.generate(workflow)) {
            console.log('Generation chunk received:', chunk.type, chunk.data);
            
            if (chunk.type === 'progress') {
                progressPercent.value = (chunk.data.value / chunk.data.total) * 100;
                console.log(`Progress: ${Math.floor(progressPercent.value)}%`);
            } else if (chunk.type === 'preview') {
                displayImageUrls.value = [chunk.data.image];
                console.log('Preview image received');
            } else if (chunk.type === 'status') {
                console.log("Queue left:", chunk.data.queue_remaining);
            } else if (chunk.type === 'finished') {
                displayImageUrls.value = chunk.data.images;
                console.log('Generation finished, images:', chunk.data.images);
            }
        }
    } catch (error) {
        console.error('Generation error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert('Generation failed: ' + errorMessage);
    }
}

async function stopGeneration() {
    console.log('Stopping generation...');
    comfyuiStore.stopGeneration();
}

// Generate random seed
function randomizeSeed() {
    seed.value = Math.floor(Math.random() * 1000000);
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
                    @click="$router.back()">Back</button>
            </div>
        </div>
    </div>
    <div v-else class="size-full flex flex-col md:flex-row gap-2 overflow-y-auto md:overflow-y-hidden md:h-[calc(100dvh-1rem)]">
        <!-- Parameters Panel -->
        <div class="flex flex-col gap-4 md:w-1/2 md:overflow-y-auto p-4">
            <h2 class="text-2xl font-semibold">Generation Parameters</h2>
            
            <!-- Positive Prompt -->
            <div class="flex flex-col gap-2">
                <label for="positive-prompt" class="font-medium">Positive Prompt</label>
                <textarea 
                    id="positive-prompt"
                    v-model="positivePrompt" 
                    class="has-tag-autocomplete w-full p-3 bg-bg-light rounded-lg resize-none"
                    placeholder="Enter positive prompt..."
                    title="positive prompt"
                    rows="3"
                />
            </div>

            <!-- Negative Prompt -->
            <div class="flex flex-col gap-2">
                <label for="negative-prompt" class="font-medium">Negative Prompt</label>
                <textarea 
                    id="negative-prompt"
                    v-model="negativePrompt" 
                    class="has-tag-autocomplete w-full p-3 bg-bg-light rounded-lg resize-none"
                    placeholder="Enter negative prompt..."
                    title="negative prompt"
                    rows="2"
                />
            </div>

            <!-- Dimensions -->
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label for="width-input" class="font-medium">Width</label>
                    <input 
                        id="width-input"
                        v-model.number="width" 
                        type="number" 
                        step="8" 
                        min="64" 
                        max="2048"
                        class="w-full p-3 bg-bg-light rounded-lg"
                    />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="height-input" class="font-medium">Height</label>
                    <input 
                        id="height-input"
                        v-model.number="height" 
                        type="number" 
                        step="8" 
                        min="64" 
                        max="2048"
                        class="w-full p-3 bg-bg-light rounded-lg"
                    />
                </div>
            </div>

            <!-- Sampling Parameters -->
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label for="steps-input" class="font-medium">Steps</label>
                    <input 
                        id="steps-input"
                        v-model.number="steps" 
                        type="number" 
                        min="1" 
                        max="150"
                        class="w-full p-3 bg-bg-light rounded-lg"
                    />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="cfg-scale-input" class="font-medium">CFG Scale</label>
                    <input 
                        id="cfg-scale-input"
                        v-model.number="cfgScale" 
                        type="number" 
                        step="0.1" 
                        min="1" 
                        max="30"
                        class="w-full p-3 bg-bg-light rounded-lg"
                    />
                </div>
            </div>

            <!-- Sampler and Scheduler -->
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="font-medium">Sampler</label>
                    <select v-model="sampler" class="w-full p-3 bg-bg-light rounded-lg">
                        <option 
                            v-for="samplerOption in availableSamplers" 
                            :key="samplerOption" 
                            :value="samplerOption"
                        >
                            {{ samplerOption }}
                        </option>
                    </select>
                </div>
                <div class="flex flex-col gap-2">
                    <label for="scheduler-select" class="font-medium">Scheduler</label>
                    <select id="scheduler-select" v-model="scheduler" class="w-full p-3 bg-bg-light rounded-lg">
                        <option 
                            v-for="schedulerOption in availableSchedulers" 
                            :key="schedulerOption" 
                            :value="schedulerOption"
                        >
                            {{ schedulerOption }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Model Selection -->
            <div class="flex flex-col gap-2">
                <label for="model-select" class="font-medium">Model</label>
                <select 
                    id="model-select"
                    v-model="modelName" 
                    class="w-full p-3 bg-bg-light rounded-lg"
                    :class="{ 'ring-2 ring-amber-400': !modelName && availableCheckpoints.length > 0 }"
                    :disabled="availableCheckpoints.length === 0"
                >
                    <option value="" disabled>
                        {{ availableCheckpoints.length === 0 ? 'Loading models...' : 'Select a model' }}
                    </option>
                    <option 
                        v-for="checkpoint in availableCheckpoints" 
                        :key="checkpoint" 
                        :value="checkpoint"
                    >
                        {{ checkpoint }}
                    </option>
                </select>
                <small class="text-text/70">
                    {{ availableCheckpoints.length }} model(s) available in ComfyUI
                </small>
                <div v-if="!modelName && availableCheckpoints.length > 0" class="text-amber-400 text-sm flex items-center gap-1">
                    ⚠️ No model selected - generation may fail without a checkpoint
                </div>
            </div>

            <!-- Seed -->
            <div class="flex flex-col gap-2">
                <label for="seed-input" class="font-medium">Seed</label>
                <div class="flex gap-2">
                    <input 
                        id="seed-input"
                        v-model.number="seed" 
                        type="number" 
                        min="-1"
                        class="flex-1 p-3 bg-bg-light rounded-lg"
                        placeholder="Random seed (-1)"
                    />
                    <button 
                        @click="randomizeSeed"
                        class="px-4 py-3 bg-surface rounded-lg hover:bg-surface-light transition-colors"
                    >
                        Random
                    </button>
                </div>
            </div>
        </div>

        <!-- Preview Panel -->
        <div class="flex flex-col gap-2 md:w-1/2 md:overflow-y-auto p-4">
            <!-- Progress Bar -->
            <div class="relative w-full h-8 bg-bg rounded-lg ring-1 ring-text/50 ring-inset">
                <div class="h-full bg-blue-700 rounded-lg transition-all duration-100"
                    :style="{ width: progressPercent + '%' }"></div>
                <span class="absolute top-0 left-0 text-2xl h-8 pl-2 items-center justify-center flex font-semibold text-text">{{
                    Math.floor(progressPercent)
                }}%</span>
            </div>

            <!-- Image Display -->
            <div v-if="displayImageUrls.length === 0"
                class="bg-gradient-to-br from-surface to-bg-light w-full aspect-square rounded-lg flex items-center justify-center">
                <span class="text-text/50 text-lg">Generated images will appear here</span>
            </div>
            <div v-else class="flex flex-col gap-2 w-full">
                <a v-for="(imageUrl, index) in displayImageUrls" :key="index" :href="imageUrl" target="_blank"
                    class="w-full">
                    <img :src="imageUrl" class="w-full rounded-lg" />
                </a>
            </div>

            <RouterLink to="/history"
                class="bg-surface p-4 rounded-xl text-lg cursor-pointer flex flex-row gap-2 items-center justify-center">
                View History
            </RouterLink>
        </div>

        <!-- Action Buttons -->
        <div class="size-14 fixed bottom-0 right-22 m-2 rounded-full shadow-xs shadow-black">
            <div class="size-full bg-bg-dark rounded-full opacity-85"
                :class="{ '!bg-red-600 !opacity-100': comfyuiStore.queue.queue_running.length > 0 }"
                @click="stopGeneration">
                <FaStop class="size-full p-4 text-text" />
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