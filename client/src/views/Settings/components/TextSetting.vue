<script setup lang="ts">
defineProps<{
    label: string;
    modelValue: string;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const id = Math.random().toString(36).substring(2, 15);
</script>

<template>
    <div class="bg-slate-800 p-2 rounded-xl flex flex-col gap-1">
        <label :for="id" class="font-semibold w-full">{{ label }}</label>
        <input :disabled :id="id" type="text" :value="modelValue"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            class="w-full bg-slate-700 p-2 rounded-lg" />
    </div>
</template>