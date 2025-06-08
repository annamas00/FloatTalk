<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
      <form @submit.prevent="handleLogin">
        <input v-model="email" type="email" placeholder="Email" class="input mb-4" required />
        <input v-model="password" type="password" placeholder="Password" class="input mb-6" required />
        <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-500">
          Login
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()

async function handleLogin() {
  try {
    const res = await axios.post('http://localhost:8000/token', new URLSearchParams({
      username: email.value,
      password: password.value
    }))
    const token = res.data.access_token
    localStorage.setItem('token', token)
    alert('✅ Login erfolgreich!')
    router.push('/') // Zurück zur Hauptseite
  } catch (err) {
    alert('❌ Login fehlgeschlagen!')
    console.error(err)
  }
}
</script>

<style scoped>

.input {
  width: 100%;
  border: 1px solid #ccc;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  color: #1f2937; /* text-gray-800 */
}
</style>