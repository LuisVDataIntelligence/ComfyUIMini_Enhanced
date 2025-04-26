type BaseInputOptions = {
    default: any;
}

type ObjectInfoResponse = Record<string, {
    input: {
        required: Record<string, any>;
    }
}>;