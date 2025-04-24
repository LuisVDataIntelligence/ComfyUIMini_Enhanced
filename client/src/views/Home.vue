<script setup lang="ts">
import useAppWorkflowsStore from '../stores/appWorkflows';

const appWorkflowsStore = useAppWorkflowsStore();

</script>

<template>
    <div class="size-full flex flex-col">
        <span class="flex flex-row text-lg font-bold mb-2">
            ComfyUIMini
            <span class="w-full"></span>
            v2.0.0
        </span>
        <RouterLink to="/import"
            class="w-full bg-slate-800 text-white p-6 rounded-xl text-center text-lg cursor-pointer">
            Import Workflow
        </RouterLink>
        <div class="flex flex-col gap-2 mt-2" role="list">
            <RouterLink v-for="(workflow, index) in appWorkflowsStore.appWorkflows" :to="`/workflow/local/${index}`"
                class="bg-slate-700 p-4 rounded-xl cursor-pointer">
                <span class="text-lg font-bold">{{ workflow.title }}</span>
                <p class="text-gray-300 text-sm">{{ workflow.description }}</p>
            </RouterLink>
        </div>
    </div>
</template>