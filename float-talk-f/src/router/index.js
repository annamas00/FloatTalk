// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import ThrowBottle from '../views/ThrowBottle.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/throw', component: ThrowBottle },
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router;