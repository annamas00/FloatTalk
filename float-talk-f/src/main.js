import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'leaflet/dist/leaflet.css'
import router from './router';

createApp(App).use(router).mount('#app');

