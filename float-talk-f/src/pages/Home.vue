<!--<template>
  // <div>
//    <h1>🏠 Home</h1>
//    <router-link to="/login">Zum Login</router-link>
//  </div>
// </template> -->

<template>
  <div class="grid-container">
    <div class="map-container" id="map"></div>
    <!-- restliches Layout -->
  </div>

  <div>
    <div id="map"></div>
    <button @click="goToLogin">🔑 Login</button>
  </div>
</template>

<script setup>
import { onMounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon2x from '../assets/leaflet/marker-icon-2x.png'
import markerIcon from '../assets/leaflet/marker-icon.png'
import markerShadow from '../assets/leaflet/marker-shadow.png'

import { useRouter } from 'vue-router'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

onMounted(async () => {
  await nextTick()
  const map = L.map('map').setView([48.1351, 11.5820], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
})




const router = useRouter()

function goToLogin() {
  router.push('/login')
}
</script>
