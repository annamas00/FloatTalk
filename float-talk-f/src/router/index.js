import { createRouter, createWebHistory } from 'vue-router'

// Views
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import ThrowBottle from '../views/ThrowBottle.vue'

// Layouts (new)
import MainLayout from '../layouts/MainLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'



const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  }
]



export const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
