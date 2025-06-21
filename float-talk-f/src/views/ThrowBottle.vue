<template>
  <div class="p-6 max-w-md mx-auto">
    <h2 class="text-xl font-bold mb-4">Throw a Bottle</h2>
    <div class="mb-4">
      <label class="block mb-1">Your Location:</label>
      <input v-model="locationDisplay" class="input" readonly />
    </div>
    <div class="mb-4">
      <label class="block mb-1">Write a message:</label>
      <textarea v-model="message" class="input" placeholder="Your message..."></textarea>
    </div>
    <button @click="sendBottle" class="btn-action">Send</button>
  </div>
  <!-- Success Modal -->
<!--<div v-if="showSuccessModal" class="modal-overlay">
  <div class="modal-box">
    <p class="text-lg font-semibold text-green-700">✅ Bottle erfolgreich geworfen!</p>
    <button @click="goToHome" class="btn-modal">Zurück zur Karte</button>
  </div>
</div>-->
  
  <div v-if="showModal" class="modal-overlay">
    <div class="modal">
      <h2 class="text-lg font-semibold mb-4">📦 Bottle thrown successfully!</h2>
      <p class="mb-4">Your message has been thrown and saved on the map.</p>
      <button @click="goToMap" class="btn-action">Go back to map</button>
    </div>
  </div>


</template>


<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { getOrCreateUserId } from '../auth.js'
import { useRouter } from 'vue-router'

const locationDisplay = ref('Getting location...')
const location = ref({ lat: null, lon: null })
const message = ref('')
const userId = ref('')
const showModal = ref(false)
const router = useRouter()

onMounted(async () => {
  userId.value = await getOrCreateUserId()
  navigator.geolocation.getCurrentPosition(pos => {
    location.value.lat = pos.coords.latitude
    location.value.lon = pos.coords.longitude
    locationDisplay.value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
  }, err => {
    locationDisplay.value = 'Location not available'
  })
})

async function sendBottle() {
  const now = new Date()
  const durationEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  if (!message.value || !location.value.lat || !location.value.lon) {
    alert("Bitte Nachricht und Standort angeben.")
    return
  }

  await axios.post('http://127.0.0.1:8000/log', {
    user_id: userId.value,
    action: 'bottle_thrown',
    details: {
      message: message.value,
      time: now.toISOString(),
      duration_until: durationEnd.toISOString(),
      location: location.value
    }
  })

  showModal.value = true
}

function goToMap() {
  router.push({
    path: '/',
    query: {
      lat: location.value.lat,
      lon: location.value.lon,
      msg: message.value
    }
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: white;
  color: black;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-box {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.btn-modal {
  margin-top: 1rem;
  background-color: #10b981; /* Tailwind Emerald */
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: bold;
  transition: background 0.2s;
}
.btn-modal:hover {
  background-color: #059669;
}


</style>