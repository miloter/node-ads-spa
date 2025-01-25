<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSession } from '../../stores.js';
import { appendAlert, removeAlerts } from '../../utils/globals.js';

const text = ref('');
const contact = ref('');
const router = useRouter();
const { user, spinner } = storeToRefs(useSession());
const { host, getUser } = useSession();

const onSubmit = () => {
    removeAlerts();
    spinner.value = true;
    fetch(`${host}/api/ads/create`, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text.value,
            contact: contact.value
        })
    })
        .then(response => {
            return response.json()
        })
        .then(json => {
            if (json.error) throw new Error(json.error);
            appendAlert(json.success, 'success');
        })
        .catch(error => {
            appendAlert(error.message, 'danger');
        })
        .finally(() => spinner.value = false);
};

// Establece el usuario con autorización, o regresa a la página de login
(async () => {
    user.value = await getUser();
    if (!user.value) {
        router.push('/auth/login');
    }
})();
</script>

<template>
    <form @submit.prevent="onSubmit">
        <div class="mb-3">
            <label for="text" class="form-label">Texto</label>
            <textarea v-model="text" id="text" rows="8" class="form-control">{{ text }}</textarea>
        </div>
        <div class="mb-3">
            <label for="contact" class="form-label">Contacto</label>
            <textarea v-model="contact" id="contact" rows="4" class="form-control">{{ contact }}</textarea>
        </div>
        <button type="submit" class="btn btn-primary">Enviar</button>
    </form>
</template>