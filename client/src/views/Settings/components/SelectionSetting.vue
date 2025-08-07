<script setup lang="ts">
defineProps<{
    label: string;
    modelValue: number;
    options: [number, string][],
    disabled?: boolean;
    placeholder?: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const id = Math.random().toString(36).substring(2, 15);
</script>

<template>
    <div class="bg-bg p-2 flex flex-col rounded-lg gap-1" >
        <label :for="id" class="text-text">{{ label }}</label>
        <select class="bg-bg-light p-2 rounded-md w-full" :id :value="modelValue" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)">
            <option v-for="option in options" :value="option[0]">{{ option[1] }}</option>
        </select>
    </div>
</template>