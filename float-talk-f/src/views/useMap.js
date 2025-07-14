import { ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import markerIcon2x from '../assets/leaflet/marker-icon-2x.png'
import markerIcon from '../assets/leaflet/marker-icon.png'
import markerShadow from '../assets/leaflet/marker-shadow.png'
import { nextTick } from 'vue'
const map = ref(null)
const mapInstance = ref(null)
const userLat = ref(null)
const userLon = ref(null)
const allBottleMarkers = []
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const useMap = () => {
  const map = ref(null)
  const mapInstance = ref(null)
  const userLat = ref(null)
  const userLon = ref(null)
  const allBottleMarkers = []

  async function initMap(containerId = 'map', center = [48.1351, 11.5820], zoom = 13) {
    const container = document.getElementById(containerId)
    if (!container) {
      console.error(`❌ Map container '${containerId}' not found.`)
      return
    }

    // Remove existing map
    if (mapInstance.value) {
      mapInstance.value.remove()
      mapInstance.value = null
      console.warn('⚠️ Removed existing map instance')
    }

    // Initialize new map
    mapInstance.value = L.map(container).setView(center, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance.value)

    map.value = mapInstance.value

    // Register moveend and call once
    mapInstance.value.on('moveend', handleMoveEnd)
    await handleMoveEnd()
  }

  async function handleMoveEnd() {
    if (!mapInstance.value) return
    const zoom = mapInstance.value.getZoom()
    if (zoom < 12) return

    const center = mapInstance.value.getCenter()
    const lat = center.lat
    const lon = center.lng

    const bottles = await fetchNearbyBottles(lat, lon)
    renderBottleMarkers(bottles)
  }

  function renderBottleMarkers(bottles) {
    // Clear old
    allBottleMarkers.forEach(m => mapInstance.value.removeLayer(m))
    allBottleMarkers.length = 0

    bottles.forEach(b => {
      const loc = b.location || {}
      if (!('lat' in loc && 'lon' in loc)) return

      const marker = L.marker([loc.lat, loc.lon]).addTo(mapInstance.value)
        .bindPopup(`<small>Tags: ${(b.tags || []).join(', ')}</small><br/><button onclick="window.replyToBottle('${b.bottle_id}')">💬 Reply</button>`)

      allBottleMarkers.push(marker)
    })
  }

  async function fetchNearbyBottles(lat, lon) {
    const res = await axios.get(`${API_BASE}/nearby_bottles`, {
      params: { lat, lon, radius: 5000 }
    })
    return res.data.bottles || []
  }

  return {
    map,
    mapInstance,
    userLat,
    userLon,
    initMap,
    renderBottleMarkers,
    fetchNearbyBottles
  }
}
export default useMap