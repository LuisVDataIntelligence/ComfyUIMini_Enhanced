type WorkflowNodes = Record<string, {
    _meta: {
        title: string;
    } & unknown;
    class_type: string;
    inputs: Record<
        string, // Name of input
        string | number | (string | number)[] | any // Default data for input
    >;
} & unknown>;