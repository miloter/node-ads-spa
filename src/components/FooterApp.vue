<script setup>
    import { ref } from 'vue';
    
    const year = ref(new Date().getFullYear());
</script>

<template>
    <footer class="m-1 p-1 bg-dark text-white fw-bold">
        <div class="text-center">
            &copy; <a href="https://facite.es" class="text-white" target="_blank">
                Facite
            </a>
            <span>{{ year }}</span>            
        </div>
    </footer>
</template>