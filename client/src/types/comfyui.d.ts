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