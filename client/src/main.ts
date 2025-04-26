import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './router';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);

// https://stackoverflow.com/a/76281017
app.directive('click-outside', {
    beforeMount: function (element, binding) {
        console.log({
            element,
            binding
        });

        //  check that click was outside the el and his children
        element.clickOutsideEvent = function (event) {
            // and if it did, call method provided in attribute value
            if (!(element === event.target || element.contains(event.target))) {
                binding.value(event);
            }
        };
        document.body.addEventListener('click', element.clickOutsideEvent)
    },
    unmounted: function (element) {
        document.body.removeEventListener('click', element.clickOutsideEvent)
    }
});

app.mount('#app');
