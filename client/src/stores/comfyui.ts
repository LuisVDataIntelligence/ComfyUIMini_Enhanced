import { defineStore } from "pinia";
import { ref } from "vue";
import previewBlobToB64 from "../utils/generation/previewBlobToB64";
import useConfigStore from "./config";

async function initComfyData(comfyuiUrl: string, objectInfo: ReturnType<typeof ref<ObjectInfo | null>>) {
    const response = await fetch(`${comfyuiUrl}/api/object_info`);
    const data = await response.json();

    objectInfo.value = data;
}

const useComfyStore = defineStore('comfyui', () => {
    const comfyuiUrl = useConfigStore().comfyuiUrl;
    const comfyuiWsUrl = useConfigStore().comfyuiWsUrl;

    const comfyObjectInfo = ref<ObjectInfo | null>(null);
    const comfyQueue = ref<QueueResponse>({ queue_running: [], queue_pending: [] });
    const comfyHistory = ref<HistoryResponse>({});

    const loading = ref(false);

    async function fetchComfyObjectInfo() {
        if (comfyObjectInfo.value || loading.value) return;

        loading.value = true;

        await initComfyData(comfyuiUrl, comfyObjectInfo);
        loading.value = false;
    }

    function getInputInfo(nodeClass: string, inputName: string) {
        if (!comfyObjectInfo.value) {
            return null;
        }

        const nodeInfo = comfyObjectInfo.value[nodeClass];

        if (!nodeInfo) {
            return null;
        }

        const inputInfo = nodeInfo.input.required[inputName];

        if (!inputInfo) {
            return null;
        }

        return inputInfo;
    }

    async function* generate(workflow: WorkflowNodes): AsyncGenerator<GeneratorYield, void, unknown> {
        const socket = new WebSocket(comfyuiWsUrl + '?clientId=comfyuimini');
        let promptId: string | null = null;

        const messageQueue: GeneratorYield[] = [];

        let setSocketOpen: (value?: any) => void;
        const socketOpened = new Promise(resolve => setSocketOpen = resolve);

        let isFinished = false;
        let finalImageUrls: string[] = [];

        socket.onopen = async () => {
            setSocketOpen();
            console.log('Connected to ComfyUI websocket.');

            // Send prompt
            const response = await fetch(`${comfyuiUrl}/prompt`, {
                method: 'POST',
                body: JSON.stringify({
                    prompt: workflow,
                    clientId: 'comfyuimini'
                }),
            });

            promptId = (await response.json()).prompt_id;
        }

        socket.onmessage = async (event) => {
            if (typeof event.data === 'string') {
                const messageData = JSON.parse(event.data);

                if (messageData.type === 'progress') {
                    messageQueue.push({
                        type: 'progress',
                        data: {
                            value: messageData.data.value,
                            total: messageData.data.max,
                        }
                    });
                } else if (messageData.type === 'status') {
                    messageQueue.push({
                        type: 'status',
                        data: {
                            queue_remaining: messageData.data.status.exec_info.queue_remaining,
                        }
                    });

                    refreshQueue();

                    const response = await fetch(`${comfyuiUrl}/history/${promptId}`);
                    const history: HistoryResponse = await response.json();

                    if (!promptId || Object.keys(history).length === 0) {
                        console.log('No history found for prompt id', promptId);
                        return;
                    }

                    if (history[promptId].status.completed) {
                        console.log('Finished generation, closing socket.')

                        const outputs = history[promptId].outputs;

                        for (const node of Object.values(outputs)) {
                            node.images.map((imageData) => {
                                finalImageUrls.push(`${comfyuiUrl}/api/view?filename=${imageData.filename}&subfolder=${imageData.subfolder}&type=${imageData.type}`)
                            });
                        }

                        isFinished = true;
                        socket.close();
                    }
                }
            } else if (event.data instanceof Blob) {
                messageQueue.push({
                    type: 'preview',
                    data: {
                        image: await previewBlobToB64(event.data)
                    }
                });
            }
        }

        socket.onclose = () => {
            console.log('Disconnected from ComfyUI websocket.');
        }

        await socketOpened;

        while (!isFinished || messageQueue.length > 0) {
            if (messageQueue.length > 0) {
                yield messageQueue.shift()!;
            } else {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // This is done here to ensure that it is sent and not discardrd discarded due to isFinished being true
        yield { type: 'finished', data: { images: finalImageUrls } };
    }

    async function refreshQueue() {
        const response = await fetch(`${comfyuiUrl}/queue`);
        const queue: QueueResponse = await response.json();

        comfyQueue.value = queue;
    }

    async function loadFullHistory() {
        const response = await fetch(`${comfyuiUrl}/history`);
        const history: HistoryResponse = await response.json();

        comfyHistory.value = history;
    }

    async function stopGeneration() {
        await fetch(`${comfyuiUrl}/interrupt`, {
            method: 'POST',
        });

        refreshQueue();
    }

    fetchComfyObjectInfo();

    return {
        comfyuiUrl,
        loading,
        queue: comfyQueue,
        history: comfyHistory,
        loadFullHistory,
        stopGeneration,
        fetchComfyObjectInfo,
        getInputInfo,
        generate
    };
});

export default useComfyStore;