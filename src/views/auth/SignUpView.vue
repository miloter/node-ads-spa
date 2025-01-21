<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSession } from '../../stores.js';
import { host, getUser, appendAlert, removeAlerts } from '../../utils/globals.js';

const files = ref([]);
const isFilesReady = ref(true);
const email = ref('');
const username = ref('');
const password = ref('');
const router = useRouter();
const { user } = storeToRefs(useSession());

const onSubmit = event => {
    event.preventDefault();
    removeAlerts();

    // Si los ficheros no están listos termina
    if (!isFilesReady.value) {
        return appendAlert('Los ficheros no están listos, inténtelo en unos momentos', 'warning');
    }

    // Envía el formulario con los cambios
    fetch(`${host}/api/auth/signup`, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email.value,
            username: username.value,
            password: password.value,
            files: files.value
        })
    })
        .then(response => {
            return response.json()
        })
        .then(json => {
            if (json.error) throw new Error(json.error);            
            // Redirigimos a la página de anuncios
            user.value = json.user;
            router.push('/ads');            
        })
        .catch(error => {
            appendAlert(error.message, 'danger');
        });
};

const onFileChange = event => {
    isFilesReady.value = false;
    files.vale = [];

    const filePromises = Object.entries(event.target.files).map(item => {
        // Crea una promesa de conversión a base 64 para cada fichero
        return new Promise((resolve, reject) => {
            // El índice 1 contiene los datos del fichero
            const file = item[1];
            const { name, type, size, lastModified } = file;
            const reader = new FileReader();

            reader.readAsDataURL(file);
            reader.onload = event => {
                files.value.push({
                    content: event.target.result,
                    name,
                    type,
                    size,
                    lastModified
                });
                resolve();
            };
            reader.onerror = () => {
                console.error(`Error convirtiendo fichero ${name}`);
                reject();
            }
        });
    });

    // Intenta la conversión
    Promise.all(filePromises)
        .then(() => isFilesReady.value = true)
        .catch(error => console.error(error));
}

// Si existe un usuario válido volvemos a la página de anuncios
(async () => {
    user.value = await getUser();
    if (user.value) router.push('/ads');
})();
</script>

<template>
    <form @submit.prevent="onSubmit" class="w-50 mx-auto" method="post">
        <div class="mb-3">
            <div class="mb-1">
                <label for="file" class="form-label">Avatar opcional</label>
                <input type="file" id="file" accept=".png, .jpg, .jpeg, .gif, .bmp" @change="onFileChange"
                    class="form-control">
            </div>
            <!-- Contenedor de imágenes para subir -->
            <div class="d-flex flex-wrap justify-content-center align-items-center gap-1">
                <img v-for="file of files" :key="file.name" :src="file.content" width="128" alt="Imagen para subir">
            </div>
        </div>
        <div class="mb-3">
            <label for="email" class="form-label"><b>(*) Email</b></label>
            <input type="email" id="email" v-model="email" class="form-control" placeholder="Su e-mail" required>
        </div>
        <div class="mb-3">
            <label for="username" class="form-label"><b>(*) Usuario</b></label>
            <input type="text" id="username" v-model="username" class="form-control" placeholder="Su nombre de usuario"
                required>
        </div>
        <div class="mb-3">
            <label for="password" class="form-label"><b>(*) Contraseña</b></label>
            <input type="password" id="password" v-model="password" class="form-control" placeholder="Su contraseña"
                required />
        </div>
        <button type="submit" class="btn btn-primary">Resistrarse</button>
    </form>
    <p class="text-center">¿Ya tiene una cuenta? <RouterLink to="/auth/login">Iniciar Sesión</RouterLink>
    </p>
    <p class="text-center fw-bold">(*) Campos obligatorios</p>
</template>