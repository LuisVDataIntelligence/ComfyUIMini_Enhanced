import { defineStore } from "pinia";

interface Config {
    comfyUi: {
        urlConfig: {
            base: string;
            secure: boolean; // Use https/wss?
            custom: boolean; // Allow inputting custom urls for `url` and `ws`
            customUrl: string;
            customWs: string;
        },
    },
    ui: {
        animations: boolean;
    }
}

export const useConfigStore = defineStore('config', {
    state: (): Config => ({
        comfyUi: {
            urlConfig: {
                base: `${window.location.hostname}:8188`,
                secure: false,
                custom: false,
                customUrl: `http://${window.location.hostname}:8188`,
                customWs: `ws://${window.location.hostname}:8188/ws`
            }
        },
        ui: {
            animations: true
        },
    }),
    getters: {
        comfyUiUrl(state): string {
            const { base, secure, custom, customUrl } = state.comfyUi.urlConfig;
            if (custom && customUrl) return customUrl;

            const protocol = secure ? 'https://' : 'http://';
            return `${protocol}${base}`;
        },
        comfyUiWs(state): string {
            const { base, secure, custom, customWs } = state.comfyUi.urlConfig;
            if (custom && customWs) return customWs;

            const protocol = secure ? 'wss://' : 'ws://';
            return `${protocol}${base}/ws`;
        }
    },
    persist: {
        storage: localStorage,
    }
});