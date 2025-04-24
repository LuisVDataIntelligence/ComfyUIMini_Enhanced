<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    inputInfo: any;
    defaultValue: any;
    lastValue: string | number | unknown;
}>();

const numberInfo = props.inputInfo[1];

const inputValue = ref<any>(props.lastValue ?? props.defaultValue ?? props.inputInfo[1].default ?? undefined);

function getValue() {
    return inputValue.value;
}

defineExpose({
    getValue
});
</script>

<template>
    <div class="w-full *:bg-slate-600 *:p-2 *:rounded-lg *:w-full">
        <input type="number" v-if="inputInfo[0] === 'INT' || inputInfo[0] === 'FLOAT'" v-model="inputValue"
            :min="numberInfo.min ?? undefined" :max="numberInfo.max ?? undefined" :step="numberInfo.step ?? undefined"
            :title="numberInfo.tooltip ?? undefined" />

        <template v-else-if="inputInfo[0] === 'STRING'">
            <input type="text" v-if="!inputInfo[1].multiline" v-model="inputValue"
                :title="inputInfo[1].tooltip ?? undefined" />

            <textarea v-else :title="inputInfo[1].tooltip ?? undefined"
                v-model="inputValue">{{ defaultValue ?? inputInfo[1].default ?? '' }}</textarea>
        </template>

        <select v-else :title="inputInfo[1].tooltip ?? undefined" v-model="inputValue">
            <option v-for="item in inputInfo[0]" :key="item" :value="item">{{ item }}</option>
        </select>
    </div>
</template>