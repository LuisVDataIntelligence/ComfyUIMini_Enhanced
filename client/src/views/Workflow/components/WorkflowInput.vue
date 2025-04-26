<script setup lang="ts">
import { ref } from 'vue';
import useComfyStore from '../../../stores/comfyui';
import InputField from './InputField.vue';

const comfyuiStore = useComfyStore();

const props = defineProps<{
    input: AppWorkflowInputInfo;
    node: WorkflowNode;
}>();

const inputField = ref<InstanceType<typeof InputField>>();

const nodeClass = props.node.class_type;

function getValue() {
    return { nodeId: props.input.node_id, inputName: props.input.input_name, value: inputField.value?.getValue() };
}

defineExpose({
    getValue,
    node: nodeClass,
    inputName: props.input.input_name,
});
</script>

<template>
    <template v-if="input.hidden"></template>
    <template v-else>
        <div v-if="comfyuiStore.loading" class="w-full p-2 bg-slate-700 rounded-lg">
            <div class="bg-gradient-to-br from-slate-300/50 to-slate-400/50 h-5 w-1/3 rounded-md"></div>
            <div class="bg-gradient-to-br from-slate-500/50 to-slate-600/50 h-8 w-full rounded-md mt-1"></div>
        </div>
        <div v-else class="w-full p-2 bg-slate-700 rounded-lg">
            <span class="text-gray-300">{{ input.title }}</span>
            <InputField :comfyInputInfo="comfyuiStore.getInputInfo(nodeClass, props.input.input_name)"
                :defaultValue="node.inputs[props.input.input_name]" :appInputInfo="props.input" ref="inputField" />
        </div>
    </template>
</template>