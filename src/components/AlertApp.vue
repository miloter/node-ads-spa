<script setup>
const props = defineProps({
    message: String,
    type: String
});
</script>

<template>
    <div class="alert alert-dismissible" :class="'alert-' + type" role="alert">
        <div>{{ message }}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>,
    </div>
</template>