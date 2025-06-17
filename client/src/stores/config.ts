import { defineStore } from "pinia";
import { ref } from "vue";

const useConfigStore = defineStore('config', () => {
    const comfyuiUrl = ref(`http://${window.location.hostname}:8188`);
    const comfyuiWsUrl = ref(`ws://${window.location.hostname}:8188/ws`);
    const baseComfyuiUrl = ref(`${window.location.hostname}:8188`);
    const comfyuiUseSecure = ref<boolean>(false);
    const comfyuiUseCustomUrls = ref<boolean>(false);

    const animationsEnabled = ref(true);

    return {
        comfyuiUrl,
        comfyuiWsUrl,
        baseComfyuiUrl,
        comfyuiUseSecure,
        comfyuiUseCustomUrls,
        animationsEnabled
    };
}, {
    persist: true,
});

export default useConfigStore;