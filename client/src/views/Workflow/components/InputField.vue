<script setup lang="ts">
import { ref } from 'vue';
import randomNumInRange from '../../../utils/randomNumInRange';
import { FaPlus } from 'vue-icons-plus/fa';

const props = defineProps<{
    comfyInputInfo: any;
    defaultValue: any;
    appInputInfo: AppWorkflowInputInfo;
}>();

const numberInfo = props.comfyInputInfo[1];

const inputValue = ref<any>(props.appInputInfo.lastValue ?? props.defaultValue ?? props.comfyInputInfo[1].default ?? undefined);

function getValue() {
    if (props.appInputInfo.features?.increment_toggles) {
        switch (props.appInputInfo.features.increment_toggles.mode) {
            case 'random':
                inputValue.value = randomNumInRange(numberInfo.min ?? 0, numberInfo.max ?? 100, numberInfo.step ?? 1);
                break;
            case 'increment':
                inputValue.value++;
                break;
        }
    }

    return inputValue.value;
}

defineExpose({
    getValue
});

const incrementTogglesText = {
    'random': '🎲 Random',
    'increment': '🔢 Increment',
    'fixed': '🔒 Fixed'
};

const showExtraMenu = ref(false);

</script>

<template>
    <div class="w-full *:bg-slate-600 *:p-2 *:rounded-lg *:w-full">
        <div v-if="comfyInputInfo[0] === 'INT' || comfyInputInfo[0] === 'FLOAT'" class="flex flex-row gap-2">
            <input class="grow" type="number" v-model="inputValue" :min="numberInfo.min ?? undefined"
                :max="numberInfo.max ?? undefined" :step="numberInfo.step ?? undefined"
                :title="numberInfo.tooltip ?? undefined" />
            <button v-if="appInputInfo.features" @click="showExtraMenu = !showExtraMenu" class="rounded-md"
                :class="{ 'bg-slate-700': showExtraMenu }">
                <FaPlus class="box-border p-1" />
            </button>
        </div>

        <template v-else-if="comfyInputInfo[0] === 'STRING'">
            <input type="text" v-if="!comfyInputInfo[1].multiline" v-model="inputValue"
                :title="comfyInputInfo[1].tooltip ?? undefined" />

            <textarea v-else :title="comfyInputInfo[1].tooltip ?? undefined"
                v-model="inputValue">{{ defaultValue ?? comfyInputInfo[1].default ?? '' }}</textarea>
        </template>

        <select v-else :title="comfyInputInfo[1].tooltip ?? undefined" v-model="inputValue">
            <option v-for="item in comfyInputInfo[0]" :key="item" :value="item">{{ item }}</option>
        </select>
        <div v-if="appInputInfo.features?.increment_toggles && showExtraMenu"
            class="mt-2 flex flex-col gap-2 items-center">
            <input type="range" min="0" max="2" step="1" @change="(e) => {
                switch ((e.target as HTMLInputElement).value) {
                    case '0':
                        appInputInfo.features!.increment_toggles!.mode = 'random';
                        break;
                    case '1':
                        appInputInfo.features!.increment_toggles!.mode = 'increment';
                        break;
                    case '2':
                        appInputInfo.features!.increment_toggles!.mode = 'fixed';
                        break
                }
            }">
            <span class="font-bold">{{ incrementTogglesText[appInputInfo.features.increment_toggles.mode] }}</span>
        </div>
    </div>
</template>