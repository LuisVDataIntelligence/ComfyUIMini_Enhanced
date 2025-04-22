import { defineStore } from "pinia";
import { ref } from "vue";

const useAppWorkflowsStore = defineStore('appWorkflow', () => {
    const appWorkflows = ref<AppWorkflow[]>([]);

    function addWorkflow(workflow: AppWorkflow) {
        appWorkflows.value.push(workflow);
    }

    return {
        appWorkflows,
        addWorkflow
    }
}, { persist: true });

export default useAppWorkflowsStore;