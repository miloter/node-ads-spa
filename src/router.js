import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import AdsView from "./views/ads/AdsView.vue";
import LoginView from "./views/auth/LoginView.vue";
import SignUpView from "./views/auth/SignUpView.vue";
import LogoutView from "./views/auth/LogoutView.vue";

const routes = [
    { path: '/', component: HomeView},
    { path: '/ads', component: AdsView},
    { path: '/auth/login', component: LoginView},
    { path: '/auth/logout', component: LogoutView},
    { path: '/auth/signup', component: SignUpView},
];

const router = createRouter({
    routes,
    history: createWebHistory()
});

export default router;