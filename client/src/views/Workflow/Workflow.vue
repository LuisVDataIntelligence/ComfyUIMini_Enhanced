<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import useAppWorkflowsStore from '../../stores/appWorkflows';
import router from '../../router';
import { useRoute } from 'vue-router';

const appWorkflowsStore = useAppWorkflowsStore();
const openedWorkflow = ref<AppWorkflow>({
    title: 'Loading...',
    description: '',
    inputs_info: [],
    nodes: {},
});

onBeforeMount(() => {
    const workflowIndex = parseInt(useRoute().params.index as string);
    if (workflowIndex >= appWorkflowsStore.appWorkflows.length || isNaN(workflowIndex)) {
        router.push('/');
    }

    openedWorkflow.value = appWorkflowsStore.appWorkflows[workflowIndex];
});
</script>

<template>
    <div class="size-full flex flex-col">
        <div class="flex flex-col">
            <div v-for="(input, index) in openedWorkflow.inputs_info">
                <span>{{ input.title }}</span>

            </div>
        </div>
    </div>
</template>