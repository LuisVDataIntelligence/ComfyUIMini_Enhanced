import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "./layouts/MainLayout.vue";
import Home from "./views/Home.vue";
import Import from "./views/Import/Import.vue";

const routes = [
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '',
                name: 'Home',
                component: Home
            },
            {
                path: 'import',
                name: 'Import',
                component: Import
            }
        ]
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;