<script setup>
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSession } from '../stores.js';

const { user, spinner } = storeToRefs(useSession());
const { getUser } = useSession();

// Comprueba si hay un usuario que ha iniciado sesión
getUser().then(u => user.value = u);
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
                            <RouterLink to="/ads/create" class="nav-link">Crear Anuncio</RouterLink>
                        </li>
                        <li class="nav-item">
                            <div class="dropdown">
                                <button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                    aria-expanded="false">
                                    <img v-if="user.avatar" :src="'/uploads/' + user.avatar" width="64"
                                        class="rounded-circle" alt="Avatar del usuario">
                                    <template v-else>
                                        Sesión
                                    </template>
                                </button>
                                <ul class="dropdown-menu">
                                    <li>
                                        <a class="dropdown-item" @click.prevent href="#">
                                            {{ user.username }}
                                        </a>
                                    </li>
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
    <div v-show="spinner" class="d-flex justify-content-center">
        <div class="spinner-border text-success" role="status"
            style="width: 11rem; height: 11rem;"></div>
    </div>
    <div id="alert"></div>
</template>