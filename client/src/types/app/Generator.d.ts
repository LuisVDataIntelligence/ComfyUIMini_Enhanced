type ProgressChunk = {
    type: 'progress';
    data: {
        value: number;
        total: number;
    }
}

type PreviewChunk = {
    type: 'preview';
    data: {
        image: string; // Image Base64
    }
}

type StatusChunk = {
    type: 'status';
    data: {
        queue_remaining: number;
    }
}

type FinishedChunk = {
    type: 'finished';
    data: {
        images: string[];
    }
}

type GeneratorYield = ProgressChunk | PreviewChunk | StatusChunk | FinishedChunk;