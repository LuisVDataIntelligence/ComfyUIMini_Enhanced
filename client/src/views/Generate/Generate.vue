<template>
    <div class="container mx-auto p-4 max-w-4xl">
        <h1 class="text-3xl font-bold mb-6">Generate Image</h1>
        
        <!-- Connection Status -->
        <div v-if="!comfyuiStore.connected" class="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p class="text-red-300">⚠️ Not connected to ComfyUI. Please check your ComfyUI server and settings.</p>
        </div>
        
        <!-- Generation Form -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Panel - Prompts and Settings -->
            <div class="space-y-6">
                <!-- Positive Prompt -->
                <div>
                    <label class="block text-sm font-medium mb-2">Positive Prompt</label>
                    <textarea 
                        v-model="positivePrompt"
                        class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white resize-vertical min-h-[100px]"
                        placeholder="Describe what you want to generate..."
                    ></textarea>
                </div>
                
                <!-- Negative Prompt -->
                <div>
                    <label class="block text-sm font-medium mb-2">Negative Prompt</label>
                    <textarea 
                        v-model="negativePrompt"
                        class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white resize-vertical min-h-[80px]"
                        placeholder="Describe what you want to avoid..."
                    ></textarea>
                </div>
                
                <!-- Model Selection -->
                <div>
                    <label class="block text-sm font-medium mb-2">Model</label>
                    <select 
                        v-model="selectedModel"
                        class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                    >
                        <option value="">Select a model...</option>
                        <option v-for="model in availableModels" :key="model" :value="model">
                            {{ model }}
                        </option>
                    </select>
                </div>
            </div>
            
            <!-- Right Panel - Parameters -->
            <div class="space-y-6">
                <!-- Dimensions -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Width</label>
                        <input 
                            v-model.number="width" 
                            type="number" 
                            step="64" 
                            min="64" 
                            max="2048"
                            class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Height</label>
                        <input 
                            v-model.number="height" 
                            type="number" 
                            step="64" 
                            min="64" 
                            max="2048"
                            class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                        >
                    </div>
                </div>
                
                <!-- Generation Settings -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Steps</label>
                        <input 
                            v-model.number="steps" 
                            type="number" 
                            min="1" 
                            max="100"
                            class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">CFG Scale</label>
                        <input 
                            v-model.number="cfgScale" 
                            type="number" 
                            step="0.5" 
                            min="1" 
                            max="20"
                            class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                        >
                    </div>
                </div>
                
                <!-- Sampler and Scheduler -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Sampler</label>
                        <select 
                            v-model="sampler"
                            class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                        >
                            <option v-for="s in availableSamplers" :key="s" :value="s">{{ s }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Scheduler</label>
                        <select 
                            v-model="scheduler"
                            class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                        >
                            <option v-for="s in availableSchedulers" :key="s" :value="s">{{ s }}</option>
                        </select>
                    </div>
                </div>
                
                <!-- Seed -->
                <div>
                    <label class="block text-sm font-medium mb-2">Seed (-1 for random)</label>
                    <input 
                        v-model.number="seed" 
                        type="number" 
                        class="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white"
                    >
                </div>
            </div>
        </div>
        
        <!-- Generate Button -->
        <div class="mt-8 text-center">
            <button 
                @click="generateImage"
                :disabled="!comfyuiStore.connected || isGenerating || !selectedModel"
                class="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
                <FaPlay v-if="!isGenerating" class="inline mr-2" />
                <FaStop v-else class="inline mr-2" />
                {{ isGenerating ? 'Generating...' : 'Generate Image' }}
            </button>
        </div>
        
        <!-- Progress -->
        <div v-if="isGenerating" class="mt-6">
            <div class="bg-gray-700 rounded-full h-2">
                <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: progressPercent + '%' }"
                ></div>
            </div>
            <p class="text-center mt-2 text-sm text-gray-400">{{ Math.round(progressPercent) }}% complete</p>
        </div>
        
        <!-- Generated Images -->
        <div v-if="generatedImages.length > 0" class="mt-8">
            <h2 class="text-2xl font-bold mb-4">Generated Images</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="(image, index) in generatedImages" :key="index" class="relative">
                    <img 
                        :src="image" 
                        :alt="`Generated image ${index + 1}`"
                        class="w-full h-auto rounded-lg shadow-lg"
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import useComfyStore from '../../stores/comfyui';
import { FaPlay, FaStop } from 'vue-icons-plus/fa';

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
const selectedModel = ref('');

// Generation state
const isGenerating = ref(false);
const progressPercent = ref(0);
const generatedImages = ref<string[]>([]);

// Mock data for now (until ComfyUI integration is working)
const availableModels = computed(() => ['sd_xl_base_1.0.safetensors', 'sd_xl_turbo.safetensors']);
const availableSamplers = computed(() => ['euler', 'euler_a', 'heun', 'dpm_2', 'dpm_2_a', 'lms']);
const availableSchedulers = computed(() => ['normal', 'karras', 'exponential', 'sgm_uniform', 'simple']);

onMounted(() => {
    // Set default model if available
    if (availableModels.value.length > 0) {
        selectedModel.value = availableModels.value[0];
    }
    
    // Try to fetch ComfyUI object info
    comfyuiStore.fetchComfyObjectInfo?.();
});

async function generateImage() {
    if (!selectedModel.value || !comfyuiStore.connected) {
        return;
    }
    
    isGenerating.value = true;
    progressPercent.value = 0;
    
    try {
        // Create a basic workflow for testing
        const workflow = createBasicWorkflow();
        
        // Use the existing generate function from comfyStore if available
        if (comfyuiStore.generate) {
            for await (const chunk of comfyuiStore.generate(workflow)) {
                if (chunk.type === 'progress') {
                    progressPercent.value = (chunk.data.value / chunk.data.total) * 100;
                } else if (chunk.type === 'finished') {
                    generatedImages.value = chunk.data.images || [];
                }
            }
        } else {
            // Fallback: simulate generation for testing
            for (let i = 0; i <= 100; i += 10) {
                progressPercent.value = i;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            // Mock generated image
            generatedImages.value = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDQ0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIyNHB4Ij5HZW5lcmF0ZWQgSW1hZ2U8L3RleHQ+PC9zdmc+'];
        }
    } catch (error) {
        console.error('Error generating image:', error);
    } finally {
        isGenerating.value = false;
    }
}

function createBasicWorkflow() {
    // Create a basic ComfyUI workflow
    return {
        "1": {
            "_meta": { "title": "Checkpoint Loader" },
            "inputs": {
                "ckpt_name": selectedModel.value
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "_meta": { "title": "Positive Prompt" },
            "inputs": {
                "text": positivePrompt.value,
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "_meta": { "title": "Negative Prompt" },
            "inputs": {
                "text": negativePrompt.value,
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "_meta": { "title": "Empty Latent" },
            "inputs": {
                "width": width.value,
                "height": height.value,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "5": {
            "_meta": { "title": "KSampler" },
            "inputs": {
                "seed": seed.value,
                "steps": steps.value,
                "cfg": cfgScale.value,
                "sampler_name": sampler.value,
                "scheduler": scheduler.value,
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "6": {
            "_meta": { "title": "VAE Decode" },
            "inputs": {
                "samples": ["5", 0],
                "vae": ["1", 2]
            },
            "class_type": "VAEDecode"
        },
        "7": {
            "_meta": { "title": "Save Image" },
            "inputs": {
                "filename_prefix": "ComfyUIMini",
                "images": ["6", 0]
            },
            "class_type": "SaveImage"
        }
    };
}
</script>