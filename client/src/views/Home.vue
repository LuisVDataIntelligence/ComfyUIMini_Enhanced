<script setup lang="ts">
import useAppWorkflowsStore from '../stores/appWorkflows';
import { LiaMobileSolid } from 'vue-icons-plus/lia';
import { FiEdit } from 'vue-icons-plus/fi';
import { FaPlay, FaFileImport } from 'vue-icons-plus/fa';

const appWorkflowsStore = useAppWorkflowsStore();

</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Primary Generation Options -->
        <div class="flex flex-col gap-2">
            <h2 class="text-xl font-semibold">Generate Images</h2>
            
            <!-- Direct Generation (Primary) -->
            <RouterLink to="/generate" class="bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg p-4 cursor-pointer flex flex-row gap-3 items-center">
                <FaPlay class="size-6 text-white" />
                <div class="text-white">
                    <div class="font-semibold text-lg">Quick Generate</div>
                    <p class="text-blue-100">Create images with simple parameters - no workflow files needed</p>
                </div>
            </RouterLink>
            
            <!-- Import/Workflow Option -->
            <RouterLink to="/import" class="bg-surface hover:bg-surface-light transition-colors rounded-lg p-4 cursor-pointer flex flex-row gap-3 items-center">
                <FaFileImport class="size-6" />
                <div>
                    <div class="font-semibold text-lg">Import Workflow</div>
                    <p class="text-text/70">Use ComfyUI workflow files for advanced functionality</p>
                </div>
            </RouterLink>
        </div>

        <!-- Existing Workflows (if any) -->
        <div v-if="appWorkflowsStore.appWorkflows.length > 0" class="flex flex-col gap-2">
            <h2 class="text-xl font-semibold">Saved Workflows</h2>
            <div class="flex flex-col gap-2" role="list">
                <RouterLink v-for="(workflow, index) in appWorkflowsStore.appWorkflows" :to="`/workflow/local/${index}`">
                    <div class="bg-bg rounded-lg p-3 cursor-pointer flex flex-row gap-2">
                        <div class="grow min-h-24 gap-2">
                            <span class="text-lg text-text font-semibold overflow-x-auto whitespace-nowrap">{{ workflow.title }}</span>
                            <p class="text">{{ workflow.description }}</p>
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="size-12 flex items-center justify-center">
                                <LiaMobileSolid class="size-8" />
                            </div>
                            <RouterLink :to="`/workflow/local/${index}/edit`">
                                <div class="size-12 aspect-square flex items-center justify-center bg-bg-light rounded-md">
                                    <FiEdit class="size-6" />
                                </div>
                            </RouterLink>
                        </div>
                    </div>
                </RouterLink>
            </div>
        </div>
    </div>
</template>