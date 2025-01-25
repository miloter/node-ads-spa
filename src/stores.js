import { defineStore } from "pinia";

const useSession = defineStore('session', {
    state: () => ({
        /**
         * Usuario que inició sesión.
         */
        user: null,
        /**
         * Indica si un proceso está en curso.
         */
        spinner: false
    }),
    getters: {
        /**
         * Dirección del HOST donde haremos las peticiones.
         */
        host: state  => 'http://localhost:8080'
    },
    actions: {
        /**
         * Devuelve el usuario autenticado o null si no lo está.
         */
        getUser() {            
            this.spinner = true;
            return fetch(`${this.host}/api/auth/user`, { credentials: 'include' })
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    return json.user;
                })
                .catch(error => {
                    appendAlert(error.message, 'danger');
                    return null;
                })
                .finally(() => this.spinner = false);
        }
    }
});

export {
    useSession
};