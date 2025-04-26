<script setup lang="ts">
import { FaRegEdit } from 'vue-icons-plus/fa';
import useAppWorkflowsStore from '../stores/appWorkflows';

const appWorkflowsStore = useAppWorkflowsStore();

</script>

<template>
    <div class="size-full flex flex-col gap-2">
        <span class="flex flex-row text-lg font-bold">
            ComfyUIMini
            <span class="w-full"></span>
            v2.0.0
        </span>
        <RouterLink to="/import"
            class="w-full bg-slate-800 text-white p-6 rounded-xl text-center text-lg cursor-pointer">
            Import Workflow
        </RouterLink>
        <div class="flex flex-col gap-2" role="list">
            <RouterLink v-for="(workflow, index) in appWorkflowsStore.appWorkflows" :to="`/workflow/local/${index}`"
                class="bg-slate-700 p-4 rounded-xl cursor-pointer flex flex-row gap-2">
                <div class="grow">
                    <span class="text-lg font-bold">{{ workflow.title }}</span>
                    <p class="text-gray-300 text-sm">{{ workflow.description }}</p>
                </div>
                <RouterLink :to="`/workflow/local/${index}/edit`"
                    class="min-h-12 h-full aspect-square flex items-center justify-center">
                    <FaRegEdit class="size-8 " />
                </RouterLink>
            </RouterLink>
        </div>
        <RouterLink to="/settings"
            class="w-full bg-slate-800 text-white p-6 rounded-xl text-center text-lg cursor-pointer">
            Settings
        </RouterLink>
    </div>
</template>