<template>
  <div class="login-page">
    <div class="login-card">
      <h2>{{ isLogin ? 'Login' : 'Register' }}</h2>

      <form @submit.prevent="isLogin ? handleLogin() : handleRegister()" class="form-wrapper">

        <!-- Registration-only fields -->
        <template v-if="!isLogin">
          <div class="input-group">
            <span class="input-icon">👤</span>
            <input v-model="firstName" type="text" placeholder="First Name" required />
          </div>
          <div class="input-group">
            <span class="input-icon">👤</span>
            <input v-model="lastName" type="text" placeholder="Last Name" required />
          </div>
          <div class="input-group">
            <span class="input-icon">🏷️</span>
            <input v-model="nickname" type="text" placeholder="Nickname" required />
          </div>
        </template>

        <!-- Always visible fields -->
        <div class="input-group">
          <span class="input-icon">📧</span>
          <input v-model="email" type="email" placeholder="Email" required />
        </div>

        <div class="input-group">
          <span class="input-icon">🔒</span>
          <input v-model="password" type="password" placeholder="Password" required />
        </div>

        <button type="submit">{{ isLogin ? 'Login' : 'Register' }}</button>
      </form>

      <p class="toggle-text">
        {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
        <button class="toggle-button" @click="isLogin = !isLogin">
          {{ isLogin ? 'Register' : 'Login' }}
        </button>
      </p>
    </div>
  </div>
</template>





<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const isLogin = ref(true)
const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const nickname = ref('')

async function handleLogin() {
  try {
    const res = await axios.post('http://localhost:8000/token', new URLSearchParams({
      username: email.value,
      password: password.value
    }))
    const token = res.data.access_token
    localStorage.setItem('token', token)
    alert('✅ Login erfolgreich!')
    router.push('/')
  } catch (err) {
    alert('❌ Login fehlgeschlagen!')
    console.error(err)
  }
}

async function handleRegister() {
  try {
    await axios.post('http://localhost:8000/register', {
      email: email.value,
      password: password.value,
      first_name: firstName.value,
      last_name: lastName.value,
      nickname: nickname.value
    })
    alert('✅ Registrierung erfolgreich! Jetzt einloggen.')
    isLogin.value = true
  } catch (err) {
    alert('❌ Registrierung fehlgeschlagen!')
    console.error(err)
  }
}
</script>

<style>

/* Login card */
.login-card {
  background-color: white;
  padding: 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
  text-align: center;
  animation: fadeIn 0.5s ease forwards;
  transform: scale(0.95);
  opacity: 0;
  padding: 2.5rem 2rem;
}

@keyframes fadeIn {
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.login-card h2 {
  padding: 2.5rem 2rem;
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
}

/* Form layout */
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 2.75rem;
}

.input-group input {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #fefce8;
  box-sizing: border-box;
  line-height: 1.25;
}

.input-group input:hover {
  border-color: #a5b4fc;
}

.input-group input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
  user-select: none;
}

/* Submit button */
button[type='submit'] {
  background-color: #4f46e5;
  color: white;
  padding: 0.5rem;
  width: 100%;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

button[type='submit']:hover {
  background-color: #4338ca;
}

/* Toggle message */
.toggle-text {
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.toggle-button {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  font-weight: 500;
  padding-left: 0.5rem;
  text-decoration: underline;
}

.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.form-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  align-items: center;
}
</style>
