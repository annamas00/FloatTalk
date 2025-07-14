import { createRouter, createWebHistory } from 'vue-router'

// Views
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import ThrowBottle from '../views/ThrowBottle.vue'
import ProfilePage from '../views/ProfilePage.vue'
import MobileHome from '../views/MobileHome.vue'
// Layouts (new)
import MainLayout from '../layouts/MainLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import isMobile from '../../src/utils/isMobile.js'


const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/login',
    name: 'LoginPageAlias',
    component: LoginPage
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage
  },
  {
    path: '/home',
    name: 'Home',
    component: isMobile() ? MobileHome : HomePage
  }
]



export const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
