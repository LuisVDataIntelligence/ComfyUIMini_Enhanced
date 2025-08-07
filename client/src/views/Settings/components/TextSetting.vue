<script setup lang="ts">
defineProps<{
    label: string;
    modelValue: string;
    disabled?: boolean;
    placeholder?: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const id = Math.random().toString(36).substring(2, 15);
</script>

<template>
    <div class="bg-bg p-2 rounded-lg flex flex-col gap-1">
        <label :for="id" class="text-text">{{ label }}</label>
        <input :disabled :placeholder :id type="text" :value="modelValue"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            class="w-full bg-bg-light p-2 rounded-md" />
    </div>
</template>