type WorkflowNode = {
    _meta: {
        title: string;
    } & unknown;
    class_type: string;
    inputs: Record<
        string, // Name of input
        string | number | (string | number)[] | any // Default data for input
    >;
};

type WorkflowNodes = Record<string, WorkflowNode & unknown>;

type ObjectInfo = Record<string, {
    input: {
        required: any;
    }
}>;

type ResponsePrompt = [
    number, // Prompt number i.e. number of workflows ran since ComfyUI start
    string, // Prompt ID
    WorkflowNodes, // Prompt
    Record<unknown, unknown>, // Unknown, seen as empty object.
    string[], // List of output nodes
];

type ComfyImageData = {
    filename: string;
    subfolder: string;
    type: 'output' | string;
};