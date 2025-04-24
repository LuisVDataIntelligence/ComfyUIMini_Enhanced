type HistoryResponse = Record<string, { // Prompt ID
    prompt: [
        1 | number, // Seen as 1
        string, // Prompt ID, same as the prompt id above
        WorkflowNodes, // Prompt
        Record<unknown, unknown>, // Unknown, seen as empty object,
        string[], // Output nodes?
    ],
    outputs: Record<string, {
        images: {
            filename: string;
            subfolder: string;
            type: 'output' | string;
        }[];
    }>,
    status: {
        status_str: string;
        completed: boolean;
        messages: [
            'execution_start' | 'execution_cached' | 'execution_end' | string, // Status type
            {
                prompt_id: string;
                timestamp: number;
                nodes?: string[];
            }
        ][];
    },
    meta: Record<string, {
        node_id: string;
        display_node: string;
        parent_node: null | unknown; // Seen as null
        real_node_id: string;
    }>
}>;