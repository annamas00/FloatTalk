//import { defineConfig } from 'vite'
//import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
//export default defineConfig({
//  base: '/FloatTalk/',
//  plugins: [vue()],
//})

// vite.config.js
//export default {
// base: '/FloatTalk/',
//}

// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',  // <-- hier / statt /FloatTalk/
})

