<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSession } from '../../stores.js';
import { host, appendAlert, removeAlerts } from '../../utils/globals.js';

const username = ref('');
const password = ref('');
const router = useRouter();
const { user } = storeToRefs(useSession());

const onSubmit = event => {
    event.preventDefault();
    removeAlerts();

    fetch(`${host}/api/auth/login`, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    })
        .then(response => {
            return response.json()
        })
        .then(json => {
            if (json.error) throw new Error(json.error);
            user.value = json.user;
            router.push('/ads');
        })
        .catch(error => {
            appendAlert(error.message, 'danger');
        });
};
</script>

<template>
    <form @submit.prevent="onSubmit" class="w-50 mx-auto" method="post">
        <div class="mb-3">
            <label for="username" class="form-label">Usuario</label>
            <input type="text" id="username" v-model="username" class="form-control" placeholder="Su nombre de usuario"
                required />
        </div>
        <div class="mb-3">
            <label for="password" class="form-label">Contraseña</label>
            <input type="password" id="password" v-model="password" class="form-control" placeholder="Su contraseña"
                required />
        </div>
        <button type="submit" class="btn btn-primary">Iniciar sesión</button>
    </form>
    <p class="text-center">¿No tiene una cuenta? <RouterLink to="/auth/signup">Registrarse</RouterLink>
    </p>
</template>