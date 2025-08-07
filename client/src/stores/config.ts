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
        transitionSpeedMs: number;
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
            animations: true,
            transitionSpeedMs: 125,
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
    actions: {
        setTransitionSpeed(speed: number) {
            if (speed < 0) {
                throw new Error('Transition speed must be between 0 or more.');
            }

            console.log('Setting transition speed to', speed);
            this.ui.transitionSpeedMs = speed;

            this.loadTransitionSpeed();
        },
        loadTransitionSpeed() {
            if (this.ui.transitionSpeedMs == 0) {
                document.body.setAttribute('data-reduce-motion', '1');
                document.documentElement.style.setProperty('--transition-duration', '0s');
            } else {
                // set root attribute to the speed
                document.documentElement.style.setProperty('--transition-duration', `${this.ui.transitionSpeedMs}ms`);
                document.body.removeAttribute('data-reduce-motion');
            }
        },
    },
    persist: {
        storage: localStorage,
    }
});