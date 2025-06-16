<script setup lang="ts">
import { computed, ref } from 'vue';
import { VueDraggableNext } from 'vue-draggable-next';
import { AiOutlineClose } from 'vue-icons-plus/ai';
import { FaPlus } from 'vue-icons-plus/fa';
import { TbArrowBigDownFilled, TbArrowBigUpFilled } from 'vue-icons-plus/tb';

const props = defineProps<{
    modelValue: string;
}>();


const tagInputElem = ref<HTMLInputElement | null>(null);

const emit = defineEmits(['update:modelValue'])

function handleSubmit() {
    const newValue = tagInputElem.value?.value.trim() || '';

    if (!newValue.trim()) {
        return;
    }

    if (editingIndex.value !== -1) {
        const tags = splitTags.value.slice();
        tags[editingIndex.value] = newValue;
        editingIndex.value = -1;
        emit('update:modelValue', tags.join(', ') + (tags.length ? ', ' : ''));
    } else {
        emit('update:modelValue', `${props.modelValue}${newValue}, `);
    }

    tagInputElem.value!.value = "";
}

function handleBlur() {
    if (editingIndex.value !== -1) {
        editingIndex.value = -1;
        tagInputElem.value!.value = "";
    }
}

const splitTags = computed(() => {
    let value = props.modelValue.trim();
    // Remove trailing comma or comma + space
    value = value.replace(/(, ?)+$/, '');
    const list = value.split(',').map(item => item.trim());
    console.log(list);

    return list.length === 1 && list[0] === "" ? [] : list;
});

const editingIndex = ref(-1);

function editTag(tag: string, index: number) {
    tagInputElem.value!.value = tag;
    editingIndex.value = index;

    tagInputElem.value?.focus();
    tagInputElem.value?.select();
}

function removeItem(index: number) {
    const tags = splitTags.value.slice();
    tags.splice(index, 1);
    updateValueWithTags(tags);

    if (editingIndex.value === index) {
        editingIndex.value = -1;
    }
}

function increaseWeight(index: number) {
    const tags = splitTags.value.slice();
    let tag = tags[index];

    const match = tag.match(/^\((.*):([0-9.]+)\)$/);
    if (match) {
        const baseTag = match[1];
        let weight = parseFloat(match[2]);
        weight = Math.round((weight + 0.1) * 100) / 100;

        if (weight === 1) {
            tags[index] = baseTag;
        } else {
            tags[index] = `(${baseTag}:${weight})`;
        }
    } else {
        tags[index] = `(${tag}:1.1)`;
    }

    updateValueWithTags(tags);
}

function updateValueWithTags(newTags: string[]) {
    emit('update:modelValue', newTags.join(', ') + (newTags.length ? ', ' : ''));
}

function decreaseWeight(index: number) {
    const tags = splitTags.value.slice();
    let tag = tags[index];

    // Check if tag is already in the format (<tag>:<weight>)
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);
    if (match) {
        const baseTag = match[1];
        let weight = parseFloat(match[2]);
        weight = Math.round((weight - 0.1) * 100) / 100;

        if (weight === 1) {
            tags[index] = baseTag;
        } else {
            tags[index] = `(${baseTag}:${weight})`;
        }
    } else {
        tags[index] = `(${tag}:0.9)`;
    }

    updateValueWithTags(tags);
}

function getTagWeightClass(tag: string) {
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);

    if (match) {
        let weight = parseFloat(match[2]);
        weight = (Math.round((weight / 2) * 100) / 100) + 0.1;

        if (weight < 0.61) {
            return '0px 0px 0.5rem 0px rgba(37, 194, 247, 1) inset';
        }

        return `0px 0px 0.5rem 0px rgba(247, 194, 37, ${weight}) inset`
    } else {
        return '0px 0px 0.5rem 0px rgba(37, 194, 247, 0) inset';
    }
}

function getTagOpacity(tag: string) {
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);

    if (match) {
        let weight = parseFloat(match[2]);
        weight = Math.round((weight) * 100);

        if (weight < 51) {
            return '50%';
        }

        return `${weight}%`;
    } else {
        return '100%';
    }
}

function getRawTag(tag: string) {
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);

    if (match) {
        return match[1];
    } else {
        return tag;
    }
}

function getTagWeight(tag: string) {
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);

    if (match) {
        return parseFloat(match[2]);
    } else {
        return null;
    }
}

</script>

<template>
    <div class="flex flex-col">
        <VueDraggableNext v-if="splitTags.length > 0" v-model="splitTags" delay="300"
            class="flex flex-row flex-wrap gap-1">
            <div v-for="(tag, index) of splitTags" :key="index">
                <div class="bg-slate-800 p-1 box-border select-none rounded-lg flex flex-row items-center justify-center transition-all duration-150"
                    :class="[{
                        'brightness-150': index === editingIndex,
                    }]" :style="{
                        'box-shadow': getTagWeightClass(tag),
                        'opacity': getTagOpacity(tag)
                    }">
                    <div class="flex flex-row gap-1">
                        <button @click="increaseWeight(index)"
                            class="cursor-pointer bg-slate-900 p-1 rounded-md hover:brightness-110 active:brightness-125 active:scale-95 active:text-amber-300 transition-all duration-150">
                            <TbArrowBigUpFilled class="p-0.5" />
                        </button>
                        <button @click="decreaseWeight(index)"
                            class="cursor-pointer bg-slate-900 p-1 rounded-md hover:brightness-110 active:brightness-125 active:scale-95 active:text-blue-300 transition-all duration-150">
                            <TbArrowBigDownFilled class="p-0.5" />
                        </button>
                    </div>
                    <span class="flex flex-row items-center justify-center gap-1 ml-1">
                        <span @dblclick="editTag(tag, index)">
                            {{ getRawTag(tag) }}
                        </span>
                        <span v-if="getTagWeight(tag)" class="bg-slate-900 rounded-md p-1 text-gray-300">
                            {{ getTagWeight(tag) }}
                        </span>
                    </span>
                    <div @click.capture="removeItem(index)" class="cursor-pointer text-red-400 aspect-square p-1">
                        <AiOutlineClose />
                    </div>
                </div>
            </div>
        </VueDraggableNext>
        <div v-else>
            Enter a keyword and press <kbd class="bg-slate-800 px-1 rounded-sm">+</kbd> get started.
        </div>
        <form @submit.prevent="handleSubmit" class="flex flex-row gap-2 mt-1">
            <input type="text" ref="tagInputElem" class="bg-slate-700 p-2 rounded-lg w-full" placeholder="Keyword..."
                @blur="handleBlur">
            <button type="submit"
                class="bg-slate-800 p-2 rounded-lg cursor-pointer hover:brightness-110 active:brightness-125 active:scale-95 transition-all duration-150">
                <FaPlus />
            </button>
        </form>
        <span>{{ modelValue }}</span>
    </div>
</template>