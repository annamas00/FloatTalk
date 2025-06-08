<template>
  <div class="grid-container">
    <div class="map-container" id="map"></div>

    <div class="sidebar">
      <div class="flex-1 flex flex-col items-center justify-center space-y-4">
        <button @click="throwBottle" class="btn-action">
          <div class="btn-inner">
            <Send class="w-5 h-5" />
            <span>Throw a Bottle</span>
          </div>
        </button>

        <button @click="readBottle" class="btn-action">
          <div class="btn-inner">
            <BookOpen class="w-5 h-5" />
            <span>Read Past Bottles</span>
          </div>
        </button>
      </div>

      <div class="flex justify-center pb-4">
        <router-link to="/login" class="profile-btn" title="Profile">
          <UserCircle class="w-7 h-7" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import markerIcon2x from '../assets/leaflet/marker-icon-2x.png'
import markerIcon from '../assets/leaflet/marker-icon.png'
import markerShadow from '../assets/leaflet/marker-shadow.png'
import { Send, BookOpen, UserCircle } from 'lucide-vue-next'

let map
let markers = []

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

async function loadBottles() {
  const response = await axios.get('http://127.0.0.1:8000/bottles')
  const bottles = response.data

  markers.forEach(marker => map.removeLayer(marker))
  markers = []

  bottles.forEach(bottle => {
    const marker = L.marker([bottle.location.lat, bottle.location.lon]).addTo(map)
    marker.bindPopup(`<strong>Message:</strong><br/>${bottle.message}`)
    markers.push(marker)
  })
}

function getUserLocation() {
  console.log('🌍 Versuche Standort zu ermitteln...')
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userCoords = [position.coords.latitude, position.coords.longitude]
      console.log('📍 Standort erhalten:', userCoords)

      L.marker(userCoords)
        .addTo(map)
        .bindPopup('📍 Dein Standort')
        .openPopup()

      map.setView(userCoords, 13)
    },
    (error) => {
      console.warn('❌ Standortzugriff verweigert oder fehlgeschlagen', error)
    }
  )
}


onMounted(async () => {
  await nextTick()
  map = L.map('map').setView([48.1351, 11.5820], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  await loadBottles()

  // Standort-Query auslesen
  const query = new URLSearchParams(window.location.search)
  const lat = query.get('lat')
  const lon = query.get('lon')
  const msg = query.get('msg')

if (lat && lon && msg) {
  const marker = L.marker([parseFloat(lat), parseFloat(lon)])
    .addTo(map)
    .bindPopup(`<strong>📦 Neue Bottle:</strong><br/>${msg}`)
    .openPopup()

  map.setView([parseFloat(lat), parseFloat(lon)], 14)
  window.history.replaceState({}, document.title, '/')

}

})

</script>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  height: 100vh;
  width: 100vw;
}

.map-container {
  height: 100%;
  width: 100%;
}

.sidebar {
  background-color: #1f2937;
  color: white;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.btn-action {
  width: 220px;
  background-color: #374151;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.btn-action:hover {
  background-color: #4b5563;
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.profile-btn {
  background-color: #111827;
  padding: 0.5rem;
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

.profile-btn:hover {
  background-color: #374151;
}
</style>
