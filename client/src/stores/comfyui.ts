import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import previewBlobToB64 from "../utils/generation/previewBlobToB64";
import { tryCatch } from "../utils/tryCatch";
import { useConfigStore } from "./config";

async function initComfyData(comfyuiUrl: string, objectInfo: ReturnType<typeof ref<ObjectInfoResponse | null>>) {
    // Use server proxy when served through ComfyUIMini server, direct connection only when served externally
    const useProxy = window.location.port !== '8188' && window.location.port !== '80' && window.location.port !== '443';
    
    let apiUrl: string;
    if (useProxy) {
        // Use server proxy to avoid CORS issues in development
        apiUrl = '/api/comfyui/object_info';
    } else {
        // Use direct connection for production
        apiUrl = `${comfyuiUrl}/api/object_info`;
    }
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    objectInfo.value = data;
}

const useComfyStore = defineStore('comfyui', () => {
    const configStore = useConfigStore();
    
    // Use computed properties to ensure reactivity to config changes
    const comfyuiUrl = computed(() => configStore.comfyUiUrl);
    const comfyuiWsUrl = computed(() => configStore.comfyUiWs);

    const comfyObjectInfo = ref<ObjectInfoResponse | null>(null);
    const comfyQueue = ref<QueueResponse>({ queue_running: [], queue_pending: [] });
    const comfyHistory = ref<HistoryResponse>({});

    const loading = ref(false);
    const connected = ref(false);

    async function fetchComfyObjectInfo() {
        if (comfyObjectInfo.value || loading.value) return;
        loading.value = true;

        const { error } = await tryCatch(initComfyData(comfyuiUrl.value, comfyObjectInfo));

        loading.value = false;
        if (error) {
            connected.value = false
        } else {
            connected.value = true;
        }

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
        // Use server WebSocket proxy when served through ComfyUIMini server, direct connection only when served externally  
        const useProxy = window.location.port !== '8188' && window.location.port !== '80' && window.location.port !== '443';
        
        let wsUrl: string;
        if (useProxy) {
            // Use server WebSocket proxy for development to avoid CORS issues
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${wsProtocol}//${window.location.host}/api/comfyui/ws?clientId=comfyuimini`;
        } else {
            // Use direct WebSocket connection for production
            wsUrl = `${comfyuiWsUrl.value}?clientId=comfyuimini`;
        }
        
        const socket = new WebSocket(wsUrl);
        let promptId: string | null = null;

        const messageQueue: GeneratorYield[] = [];

        let setSocketOpen: (value?: any) => void;
        const socketOpened = new Promise(resolve => setSocketOpen = resolve);

        let isFinished = false;
        let finalImageUrls: string[] = [];

        socket.onopen = async () => {
            setSocketOpen();
            console.log('Connected to ComfyUI websocket.');

            // Send prompt via proxy or direct connection based on environment
            let promptUrl: string;
            if (useProxy) {
                promptUrl = '/api/comfyui/prompt';
            } else {
                promptUrl = `${comfyuiUrl.value}/prompt`;
            }
            
            const response = await fetch(promptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

                    const response = await fetch(`/api/comfyui/history/${promptId}`);
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
                                const params = new URLSearchParams({
                                    filename: imageData.filename,
                                    subfolder: imageData.subfolder,
                                    type: imageData.type,
                                });
                                finalImageUrls.push(`/api/comfyui/view?${params.toString()}`);
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
        const response = await fetch(`/api/comfyui/queue`);
        const queue: QueueResponse = await response.json();

        comfyQueue.value = queue;
    }

    async function loadFullHistory() {
        const response = await fetch(`/api/comfyui/history`);
        const history: HistoryResponse = await response.json();

        comfyHistory.value = history;
    }

    async function stopGeneration() {
        await fetch(`/api/comfyui/interrupt`, {
            method: 'POST',
        });

        refreshQueue();
    }

    async function clearHistory() {
        try {
            // Since ComfyUI doesn't support clearing history via API,
            // we clear it locally in the client
            comfyHistory.value = {};
            console.log('History cleared successfully (local only)');
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    fetchComfyObjectInfo();

    return {
        comfyuiUrl: readonly(comfyuiUrl),
        loading,
        queue: comfyQueue,
        history: comfyHistory,
        objectInfo: comfyObjectInfo,
        loadFullHistory,
        clearHistory,
        stopGeneration,
        fetchComfyObjectInfo,
        getInputInfo,
        generate,
        connected
    };
});

export default useComfyStore;
