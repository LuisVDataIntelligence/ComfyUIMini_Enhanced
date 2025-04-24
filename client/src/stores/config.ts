import { defineStore } from "pinia";
import { ref } from "vue";

const useConfigStore = defineStore('config', () => {
    const comfyuiUrl = ref(import.meta.env.VITE_COMFYUI_URL);
    const comfyuiWsUrl = ref(import.meta.env.VITE_COMFYUI_WS_URL);

    return {
        comfyuiUrl,
        comfyuiWsUrl,
    };
}, {
    persist: true,
});

export default useConfigStore;