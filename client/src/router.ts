import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "./layouts/MainLayout.vue";
import Home from "./views/Home.vue";
import Import from "./views/Import/Import.vue";
import Workflow from "./views/Workflow/Workflow.vue";
import Settings from "./views/Settings/Settings.vue";
import History from "./views/History/History.vue";

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
            },
            {
                path: 'workflow/:type/:index',
                name: 'Workflow',
                component: Workflow
            },
            {
                path: 'settings',
                name: 'Settings',
                component: Settings
            },
            {
                path: 'history',
                name: 'History',
                component: History
            }
        ]
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;