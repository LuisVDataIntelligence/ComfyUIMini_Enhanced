<script setup lang="ts">
import useAppWorkflowsStore from '../stores/appWorkflows';
import { LiaMobileSolid } from 'vue-icons-plus/lia';
import { FiEdit } from 'vue-icons-plus/fi';

const appWorkflowsStore = useAppWorkflowsStore();

</script>

<template>
    <div>
        <div 
            v-if="appWorkflowsStore.appWorkflows.length > 0" 
            class="flex flex-col gap-2" 
            role="list"
        >
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
        <p v-else class="font-semibold bg-bg-light p-4 rounded-lg">
            No workflows found. Import some using the button in the sidebar.
        </p>
    </div>
</template>