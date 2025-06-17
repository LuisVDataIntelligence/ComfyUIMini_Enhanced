import { defineStore } from "pinia";
import { ref } from "vue";

const useConfigStore = defineStore('config', () => {
    const comfyuiUrl = ref(`http://${window.location.hostname}:8188`);
    const comfyuiWsUrl = ref(`ws://${window.location.hostname}:8188/ws`);
    const baseComfyuiUrl = ref(`${window.location.hostname}:8188`);
    const comfyuiUseSecure = ref<boolean>(false);
    const comfyuiUseCustomUrls = ref<boolean>(false);

    function setComfyUrl(url: string, secure?: boolean) {
        comfyuiUrl.value = `http${secure ? 's': ''}://${url}`;
        comfyuiWsUrl.value = `ws${secure ? 's': ''}://${url}/ws`
    }

    return {
        comfyuiUrl,
        comfyuiWsUrl,
        baseComfyuiUrl,
        comfyuiUseSecure,
        comfyuiUseCustomUrls,
        setComfyUrl,
    };
}, {
    persist: true,
});

export default useConfigStore;