<script setup>
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSession } from '../stores.js';
import { host, appendAlert } from '../utils/globals.js';

const { user } = storeToRefs(useSession());

// Comprueba si hay un usuario que ha iniciado sesión
fetch(`${host}/api/auth/user`, { credentials: 'include' })
    .then(response => {
        return response.json();
    })
    .then(json => {        
        user.value = json.user;        
    })
    .catch(error => {
        appendAlert(error.message, 'danger');
    });
</script>

<template>
    <nav class="navbar navbar-expand-lg bg-body-tertiary">
        <div class="container-fluid">
            <RouterLink to="/" class="navbar-brand">NodeAds</RouterLink>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <template v-if="user">
                        <li class="nav-item">
                            <RouterLink to="/ads" class="nav-link">Anuncios</RouterLink>
                        </li>
                        <li class="nav-item">
                            <div class="dropdown">
                                <button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                    aria-expanded="false">
                                    <img v-if="user.avatar" :src="'/uploads/' + user.avatar" width="64"
                                        class="rounded-circle" alt="Avatar del usuario">
                                    <template v-else>{{ user.username }}</template>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#">Acerca de</a></li>
                                    <li>
                                        <hr class="dropdown-divider">
                                    </li>
                                    <li>
                                        <RouterLink to="/auth/logout" class="dropdown-item">Cerrar Sesión</RouterLink>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </template>
                    <template v-else>
                        <li class="nav-item">
                            <RouterLink to="/auth/login" class="nav-link">
                                Iniciar Sesión
                            </RouterLink>
                        </li>
                        <li class="nav-item">
                            <RouterLink to="/auth/signup" class="nav-link">
                                Registrarse
                            </RouterLink>
                        </li>
                    </template>
                </ul>
            </div>
        </div>
    </nav>
    <div id="alert"></div>
</template>