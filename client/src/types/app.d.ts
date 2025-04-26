interface AppWorkflowInputInfo {
    node_id: string;
    input_name: string;
    title: string;
    hidden: boolean;
    lastValue?: string | number | unknown;
    features?: {
        increment_toggles?: {
            mode: 'random' | 'increment' | 'fixed';
        };
    }
}

interface AppWorkflow {
    title: string;
    description: string;
    inputs_info: AppWorkflowInputInfo[];
    nodes: WorkflowNodes;
    lastGeneratedImages?: string[];
}
