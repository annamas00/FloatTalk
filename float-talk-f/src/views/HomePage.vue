<template>
  <div class="grid-container">
    <div class="map-container" id="map"></div>

    <div class="sidebar">
      <!-- link sidebar -->
      <div class="flex-1 flex flex-col items-center justify-center space-y-4">
        <button @click="showForm = true" class="btn-action">
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

      <!-- user -->
      <div class="flex justify-center pb-4">
        <router-link to="/login" class="profile-btn" title="Profile">
          <UserCircle class="w-7 h-7" />
        </router-link>
      </div>

      <!-- new windows -->
      <div v-if="showForm" class="form-modal">
        <div class="form-box">
          <h3 class="text-lg font-bold mb-3" >New Bottle</h3>

          <textarea v-model="bottleContent" placeholder="Write your message..." class="input mb-2"></textarea>

          <!-- taginpuit -->
          <div class="tag-input mb-2">
            <div v-for="(tag, index) in tagList" :key="index" class="tag-chip">
              {{ tag }}
              <span class="tag-close" @click="removeTag(index)">×</span>
            </div>
            <input
              v-model="tagInput"
              @keydown="handleTagKeydown"
              placeholder="Add tags"
              class="input-tag"
            />
          </div>

          <input v-model="location" placeholder="Enter location" class="input mb-4" />

          <div class="flex justify-end space-x-2">
            <button class="btn-cancel" @click="showForm = false">Cancel</button>
            <button class="btn-submit" @click="submitBottle">Send</button>
          </div>
        </div>
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


import {
  showForm,
  bottleContent,
  location,
  submitBottle,
  tagList,
  tagInput,
  removeTag,
  handleTagKeydown
} from './throwBottleLogic.js'

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
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userCoords = [position.coords.latitude, position.coords.longitude]
      L.marker(userCoords)
        .addTo(map)
        .bindPopup('📍 Your Location')
        .openPopup()
      map.setView(userCoords, 13)
    },
    (error) => {
      console.warn('Location error:', error)
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

  const query = new URLSearchParams(window.location.search)
  const lat = query.get('lat')
  const lon = query.get('lon')
  const msg = query.get('msg')

  if (lat && lon && msg) {
    const marker = L.marker([parseFloat(lat), parseFloat(lon)])
      .addTo(map)
      .bindPopup(`<strong>📦 New Bottle:</strong><br/>${msg}`)
      .openPopup()

    map.setView([parseFloat(lat), parseFloat(lon)], 14)
    window.history.replaceState({}, document.title, '/')
  }
})

function readBottle() {
  alert('Read bottles not yet implemented.')
}
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

.form-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.form-box {
  background: white;
  padding: 0 1.5rem 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
}

.input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-size: 1rem;
  box-sizing: border-box;
}

button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: bold;
  border: none;
  cursor: pointer;
}

.btn-cancel {
  background-color: #ddd;
}

.btn-submit {
  background-color: #007bff;
  color: white;
}
textarea.input {
  flex-grow: 1;
  resize: vertical; /* 允许用户拖动 */
  min-height: 100px;
}

.tag-input {
  width: 100%;
  padding: 0.5rem;               /* 统一内边距 */
  margin-bottom: 0.5rem;         /* 统一底部间隔 */
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  background-color: #f9f9f9;
  font-size: 1rem;               /* 与 .input 保持一致 */
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;              /* 手动设定统一高度（可选） */
}


.tag-chip {
  background-color: #007bff;
  color: white;
  border-radius: 9999px;
  padding: 4px 10px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease;
}

.tag-chip:hover {
  background-color: #0056b3;
}

.tag-close {
  margin-left: 8px;
  cursor: pointer;
  font-weight: bold;
}

.input-tag {
  border: none;
  outline: none;
  min-width: 100px;
  flex-grow: 1;
  padding: 0.2rem;
  background: transparent;
  font-size: 0.95rem;
}

h3 {
  color: black;
}
</style>
