<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSession } from '../../stores.js';
import TableXp from '../../components/TableXp/TableXp.vue';
import { appendAlert, removeAlerts } from '../../utils/globals.js';

const { user, spinner } = storeToRefs(useSession());
const { host, getUser } = useSession();
const router = useRouter();
const headers = ref([{
    title: 'Usuario',
    key: 'username',
    showFilter: true
}, {
    title: 'Creado el',
    key: 'last_modified',
    showFilter: true
}, {
    title: 'Texto',
    key: 'text',
    showFilter: true
}, {
    title: 'Contacto',
    key: 'contact',
    showFilter: true
}, {
    title: '',
    key: 'actions'
}]);
const rows = ref([]);

const reloadAds = () => {
    spinner.value = true;
    return fetch(`${host}/api/ads`, { credentials: 'include' })
        .then(response => {
            return response.json();
        })
        .then(json => {
            if (json.error) throw new Error(json.error);
            rows.value = json.rows;            
        })
        .catch(error => {
            appendAlert(error.message, 'danger');
        })
        .finally(() => spinner.value = false);
};

const onUpdate = (id, text, contact) => {
    removeAlerts();
    spinner.value = true;
    // Envía un PUT para actualizar el anuncio
    fetch(`${host}/api/ads`, {
        credentials: 'include',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, text, contact })
    })
        .then(response => {
            return response.json()
        })
        .then(json => {
            if (json.error) throw new Error(json.error);
            appendAlert(json.success, 'success');
            reloadAds();
        })
        .catch(error => {
            appendAlert(error.message, 'danger');
        })
        .finally(() => spinner.value = false);;
};

const onDelete = id => {
    if (!confirm(`¿Eliminar el anuncio con ID ${id}?`)) return;
    removeAlerts();
    spinner.value = true;
    fetch(`${host}/api/ads/${id}`, {
        credentials: 'include',
        method: 'DELETE'
    })
        .then(response => {
            return response.json()
        })
        .then(json => {
            if (json.error) throw new Error(json.error);
            reloadAds();
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
    if (user.value) {
        reloadAds();
    } else {
        router.push('/auth/login');
    }
})();
</script>

<template>
    <TableXp :headers="headers" :rows="rows" :rowsPerPage="5">
        <template #['username']="{ row }">
            <div class="d-flex flex-column justify-content-center align-items-center gap-1">
                <strong>
                    {{ row.username }}
                </strong>
                <img v-if="row.avatar" :src="'/uploads/' + row.avatar" width="64" class="rounded-circle"
                    alt="Avatar del usuario">
            </div>
        </template>
        <template #['text']="{ row }">
            <textarea v-if="user.id === row.user_id || user.is_admin" v-model="row.text" class="w-100"
                :rows="row.text.split('\\n').length + 2">{{ row.text }}</textarea>
            <template v-else>
                {{ row.text }}
            </template>
        </template>
        <template #['contact']="{ row }">
            <textarea v-if="user.id === row.user_id || user.is_admin" v-model="row.contact" class="w-100"
                :rows="row.contact.split('\\n').length + 2">{{ row.contact }}</textarea>
            <template v-else>
                {{ row.contact }}
            </template>
        </template>
        <template #['actions']="{ row }">
            <div v-if="user.id === row.user_id || user.is_admin"
                class="d-flex justify-content-center align-items-center gap-1">
                <a @click.prevent="onUpdate(row.id, row.text, row.contact)" class="btn btn-primary">
                    <i class="bi bi-pencil"></i>
                </a>
                <a @click.prevent="onDelete(row.id)" class="btn btn-danger">
                    <i class="bi bi-trash"></i>
                </a>
            </div>
        </template>
    </TableXp>
</template>