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
    component: MainLayout,
    children: [
      { path: '', name: 'home', component: HomePage },
      { path: 'throw', name: 'throw', component: ThrowBottle }
    ]
  },

  {
    path: '/login',
    component: AuthLayout,
    children: [
      { path: '', name: 'login', component: LoginPage }
    ]
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
