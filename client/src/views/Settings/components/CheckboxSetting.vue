<script setup lang="ts">
const emit = defineEmits(['update:modelValue']);

const props = defineProps<{
	label: string;
	modelValue: boolean;
}>();

const updateValue = () => {
	emit('update:modelValue', !props.modelValue);
}

const id = Math.random().toString(36).substring(2, 15);
</script>

<template>
	<label class="bg-bg p-2 rounded-lg flex flex-row justify-between items-center" @click="updateValue">
        <label :for="id" class="cursor-pointer text-text">{{ label }}</label>
        <input 
			:id
            class="sr-only" 
            type="checkbox" 
            :checked="modelValue"
            @change="updateValue"
            :aria-label="label"
        />

        <div
			class="w-12 h-6 flex items-center bg-border-muted hover:bg-border rounded-full cursor-pointer p-0.5 transition-all duration-150"
			:class="{ 'bg-primary!': modelValue }"
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