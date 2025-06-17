<script setup lang="ts">
const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
	label: string;
	modelValue: boolean;
}>();

const updateValue = () => {
	emit('update:modelValue', !props.modelValue);
}

</script>

<template>
	<label class="bg-slate-800 p-2 rounded-xl flex flex-row justify-between items-center" @click="updateValue">
        <span>{{ label }}</span>
        <input 
            class="sr-only" 
            type="checkbox" 
            :checked="modelValue"
            @change="updateValue"
            :aria-label="label"
        />

        <div
			class="w-12 h-6 flex items-center bg-gray-500 rounded-full cursor-pointer p-0.5 transition-all duration-150"
			:class="{ 'bg-blue-400!': modelValue }"
			role="switch"
			:aria-checked="modelValue"
			tabindex="0"
			@keydown.space.prevent="updateValue"
		>
			<div
				class="size-5 bg-white rounded-full transition-transform duration-300"
				:class="{ 'translate-x-6': modelValue }"
			></div>
		</div>
    </label>
</template>