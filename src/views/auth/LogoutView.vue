<script setup>
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSession } from '../../stores.js';
import { host, appendAlert } from '../../utils/globals.js';

const router = useRouter();
const { user } = storeToRefs(useSession());

fetch(`${host}/api/auth/logout`, { credentials: 'include' })
    .then(response => {
        return response.json()
    })
    .then(json => {
        if (json.error) throw new Error(json.error);
        user.value = null;
        router.push('/');
    })
    .catch(error => {
        appendAlert(error.message, 'danger');
    });
</script>

<template>
    <h1 class="text-center">Página de cierre de sesión</h1>
</template>