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

<!-- Manuelle Standort-Eingabe im Stil von "New Bottle" -->
<div v-if="showManualInput" class="form-modal">
  <div class="form-box">
    <h3 class="text-lg font-bold mb-3">📍 Enter location manually</h3>

    <input v-model="manualInput.country" type="text" placeholder="Country *" class="input mb-2" required />
    <input v-model="manualInput.city" type="text" placeholder="City *" class="input mb-2" required />
    <input v-model="manualInput.street" type="text" placeholder="Street (optional)" class="input mb-4" />

    <div class="flex justify-end space-x-2">
      <button class="btn-cancel" @click="showManualInput = false">Exit</button>
      <button class="btn-submit" @click="geocodeManualLocation">Save & Continue</button>
    </div>
  </div>
</div>



</template>





<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const isLogin = ref(true)
const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const nickname = ref('')


//const locationDenied = ref(false)


const showManualInput = ref(false)
const manualInput = ref({ country: '', city: '', street: '' })





function capitalizeWords(str) {
  return str
    .toLocaleLowerCase('de-DE') // erst alles klein (inkl. Ü → ü)
    .replace(/\b\p{L}+/gu, (word) =>
      word.charAt(0).toLocaleUpperCase('de-DE') + word.slice(1)
    )
}



async function handleLogin() {
  try {
    const res = await axios.post('http://localhost:8000/token', new URLSearchParams({
      username: email.value,
      password: password.value
    }))
    const token = res.data.access_token
    localStorage.setItem('token', token)

     localStorage.removeItem('userLat')
    localStorage.removeItem('userLon')
     localStorage.removeItem('userLocationText')

    
    //localStorage.setItem('user_id', response.data.user_id)


     // 📍 Nach erfolgreichem Login: Standortabfrage starten
        navigator.geolocation.getCurrentPosition(
  async (pos) => {
    const lat = parseFloat(pos.coords.latitude.toFixed(4))
    const lon = parseFloat(pos.coords.longitude.toFixed(4))
    localStorage.setItem('userLat', lat)
    localStorage.setItem('userLon', lon)

    // ➕ Reverse-Geocoding durchführen
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      const data = await res.json()
      const address = data.address || {}
      const road = address.road || ''
      const cityName = address.city || address.town || address.village || ''

      const locationText = road
        ? `${capitalizeWords(road)}, ${capitalizeWords(cityName)}`
        : capitalizeWords(cityName)

      localStorage.setItem('userLocationText', locationText)
    } catch (e) {
      console.warn('Reverse-Geocoding failed:', e)
    }

    router.push('/home')
  },
      (err) => {
        console.warn('Location not available:', err)
        showManualInput.value = true // ⬅️ Jetzt Modal anzeigen
      },
      { timeout: 5000 }
    )
    
    alert('✅ Login successful!')
  } catch (err) {
    alert('❌ Login failed!')
    console.error(err)
  }
}

/* onMounted(() => {
    // Jedes Mal Standort abfragen, auch bei wiederholtem Aufruf
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      }
      localStorage.setItem('coords', JSON.stringify(coords))
    },
    () => {
      showManualInput.value = true
    }
  )
}) */

async function geocodeManualLocation() {
  if (!manualInput.value.country || !manualInput.value.city) {
    alert('Please enter country and city.')
    return
  }

  const query = encodeURIComponent(
    `${manualInput.value.street ? manualInput.value.street + ', ' : ''}${manualInput.value.city}, ${manualInput.value.country}`
  )

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data.length === 0) {
      alert('Address not found.')
      return
    }

   const lat = data[0].lat
const lon = data[0].lon
const address = data[0].address || {}
/* const detectedCity = address.city || address.town || address.village || manualInput.value.city
const detectedStreet = address.road || manualInput.value.street
    // ➤ Location-Feld: Zeige Straße, falls vorhanden – sonst Stadt
   const locText = detectedStreet ? `${detectedStreet}, ${detectedCity}` : detectedCity

   const readable = manualInput.value.street
  ? capitalizeWords(manualInput.value.street)
  : capitalizeWords(manualInput.value.city) */
  const result = data[0]

const detectedCity = capitalizeWords(address.city || address.town || address.village || '')
const detectedStreet = capitalizeWords(address.road || '')

const formattedCity = capitalizeWords(detectedCity)
const formattedStreet = capitalizeWords(detectedStreet)

const locText = formattedStreet
  ? `${capitalizeWords(formattedStreet)}, ${capitalizeWords(formattedCity)}`
  : capitalizeWords(formattedCity)

localStorage.setItem('userLocationText', locText)
localStorage.setItem('userLat', parseFloat(result.lat))
localStorage.setItem('userLon', parseFloat(result.lon))
localStorage.setItem('userCity', formattedCity)

/*
localStorage.setItem('userLocationText', readable)

    localStorage.setItem('userLocationText', locText)
localStorage.setItem('userLat', parseFloat(lat))
localStorage.setItem('userLon', parseFloat(lon))
localStorage.setItem('userCity', detectedCity)*/

    alert('📍 Location saved!')
    showManualInput.value = false
    router.push({ path: '/home' })
  } catch (err) {
    console.error('Geocoding failed:', err)
    alert('Fehler bei der Standortsuche.')
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
    alert('✅ Registration successful! Login now.')
    isLogin.value = true
  } catch (err) {
    alert('❌ Registration failed!')
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

/*Manual form*/
.form-modal {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.form-box {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.btn-submit {
  background-color: #10b981; /* Tailwind Emerald */
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: bold;
}

.btn-cancel {
  background-color: #e5e7eb; /* Tailwind Gray-200 */
  color: #374151; /* Tailwind Gray-700 */
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: bold;
}

</style>
