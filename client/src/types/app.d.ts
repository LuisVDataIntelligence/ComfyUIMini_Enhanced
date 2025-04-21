interface AppWorkflowInputInfo {
    node_id: string;
    input_name: string;
    title: string;
    hidden: boolean;
}

interface AppWorkflow {
    title: string;
    description: string;
    inputs_info: AppWorkflowInputInfo[];
    nodes: WorkflowNodes;
}
