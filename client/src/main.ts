import { createApp } from 'vue';
import './assets/style/style.css';
import './assets/style/fonts.css';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './lib/router';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);

app.mount('#app');
