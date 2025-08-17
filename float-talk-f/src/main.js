import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './views/HomePage.vue'
import LoginPage from './views/LoginPage.vue'
import ProfilePage from './views/ProfilePage.vue'

(function ensureUserId(){
  if (!localStorage.getItem('user_id')) {
    localStorage.setItem('user_id', 'anon_' + Date.now())
  }
})();

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: HomePage },
    { path: '/login', component: LoginPage },
    { path: '/profile', component: ProfilePage }
  ]
})



createApp(App).use(router).mount('#app');

