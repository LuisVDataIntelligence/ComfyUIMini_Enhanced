import { defineStore } from "pinia";
import { ref } from "vue";

const useAppWorkflowsStore = defineStore('appWorkflow', () => {
    const appWorkflows = ref<AppWorkflow[]>([]);

    function addWorkflow(workflow: AppWorkflow) {
        appWorkflows.value.push(workflow);
    }

    function editWorkflow(index: number, workflow: AppWorkflow) {
        appWorkflows.value[index] = workflow;
    }

    function deleteWorkflow(index: number) {
        appWorkflows.value.splice(index, 1);
    }

    return {
        appWorkflows,
        addWorkflow,
        editWorkflow,
        deleteWorkflow
    }
}, { persist: true });

export default useAppWorkflowsStore;