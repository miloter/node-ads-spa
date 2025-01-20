import { defineStore } from "pinia";

const useSession = defineStore('session', {
    state: () => ({ user: null })
});

export {
    useSession
};