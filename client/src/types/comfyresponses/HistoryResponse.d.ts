type HistoryResponse = Record<string, { // Prompt ID
    prompt: ResponsePrompt,
    outputs: Record<string, {
        images: ComfyImageData[];
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