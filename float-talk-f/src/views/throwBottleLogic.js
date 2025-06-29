import { ref } from 'vue'
import axios from 'axios'
import { fetchAllBottles } from './allBottlesLogic.js'
import { fetchMyBottles } from './myBottlesLogic.js'


export const showForm = ref(false)
export const bottleContent = ref('')
export const location = ref('')
export const tagList = ref([])
export const tagInput = ref('')
export const city = ref('')
export const showSuccessModal = ref(false)
export const ttlMinutes = ref(60)


const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function capitalizeWords(str) {
  return str
    .toLocaleLowerCase('de-DE') // erst alles klein (inkl. Ü → ü)
    .replace(/\b\p{L}+/gu, (word) =>
      word.charAt(0).toLocaleUpperCase('de-DE') + word.slice(1)
    )
}




export function showThrowBottleForm() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      localStorage.setItem('userLat', pos.coords.latitude)
      localStorage.setItem('userLon', pos.coords.longitude)
      reverseGeocode(pos.coords.latitude, pos.coords.longitude)
    },
    () => {
      // Fallback auf gespeicherte Werte
      prepareThrowForm()
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )

  showForm.value = true
}


// Reverse-Geocoding für automatische Standortermittlung
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`${API_BASE}/api/reverse?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

  const a = data.address || {}

  const street   = [a.road, a.house_number].filter(Boolean).join(' ');
    const locText  = [street, a.postcode, a.city || a.town || a.village, a.country]
                      .filter(Boolean)
                      .map(capitalizeWords)
                      .join(', ');

    // Update location + localStorage
    location.value = locText
city.value = capitalizeWords(a.city || a.town || a.village || '')
    localStorage.setItem('userLocationText', locText)
    localStorage.setItem('userLat', lat)
    localStorage.setItem('userLon', lon)


  } catch (err) {
    console.error('❌ Fehler beim Reverse Geocoding:', err)
  }
}

export function addTag() {
  const value = tagInput.value.trim()
  if (
    value &&
    !tagList.value.includes(value) &&
    tagList.value.length < 5 // max tags
  ) {
    tagList.value.push(value)
  }
  tagInput.value = ''
}

export function handleTagKeydown(e) {
  const key = e.key
  if (
    (key === 'Enter' || key === ' ' || key === 'Space' || key === ',' || key === 'Comma') &&
    !e.isComposing
  ) {
    e.preventDefault()
    console.log('addInputKey：', key)
    addTag()
  }
}

export function removeTag(index) {
  tagList.value.splice(index, 1)
}

export async function submitBottle() {
  
  console.log('content:', bottleContent.value)
  console.log('tags:', tagList.value)
  console.log('location:', location.value)
  const storedLat = localStorage.getItem('userLat')
const storedLon = localStorage.getItem('userLon')
const storedCoords = localStorage.getItem('coords')
localStorage.setItem('lastBottleLat', storedLat)
localStorage.setItem('lastBottleLon', storedLon)


  if (!bottleContent.value || !location.value) {
    console.warn('no locations')
    return
  }

  
  //const now = new Date()
  //const expireAt = new Date(now.getTime() + ttlMinutes.value * 60000) // z. B. 60 Minuten

  try {
    const res = await axios.post(`${API_BASE}/add_bottle`, {
      //"http://localhost:8000/add_bottle", {
      bottle_id: "btl_" + Date.now(),
      sender_id: "user_test01",
      content: bottleContent.value,
      tags: tagList.value,
      location: storedLat && storedLon
      ? {
          lat: parseFloat(storedLat),
          lon: parseFloat(storedLon),
          address : location.value, // <-- neuer Feldname city : city.value
      }
      : JSON.parse(storedCoords),
city: city.value

      })

    console.log('✅ Server response:', res.data)

    // refresh form
    showForm.value = false
    bottleContent.value = ''
     showSuccessModal.value = true // ➤ Erfolgspopup anzeigen
    location.value = ''
    tagList.value = []
    tagInput.value = ''
       await fetchAllBottles()
       await fetchMyBottles() // ⬅️ Ergänzen


    return res.data
  } catch (err) {
    console.error('❌ Submit failed:', err)
  }

  await fetchAllBottles()   // ruft Watcher → neue Marker

}


export async function prepareThrowForm() {
  
  location.value = '' // alten Wert löschen
  city.value = ''

  // 🔁 Zuerst versuchen, alten Standorttext wiederherzustellen
const storedText = localStorage.getItem('userLocationText')
  const storedLat = localStorage.getItem('userLat')
  const storedLon = localStorage.getItem('userLon')
  const storedCoords = localStorage.getItem('coords')


  if (storedText) {
    // Wenn bereits formatierte Adresse vorhanden → verwenden
    location.value = storedText
  } else if (!isNaN(storedLat) && !isNaN(storedLon)) {
    // Wenn Koordinaten einzeln vorhanden → reverse geocoding
    await reverseGeocode(storedLat, storedLon)
  } else if (storedCoords) {
    // Wenn Koordinaten als Objekt vorhanden
    const { lat, lon } = JSON.parse(storedCoords)
    await reverseGeocode(lat, lon)
  }

  showForm.value = true
}

// helper – irgendwo in throwBottleLogic.js
const apiReverse = (lat, lon) =>
  fetch(`http://127.0.0.1:8000/api/reverse?lat=${lat}&lon=${lon}`)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });



function canOpenBottle(bottle, userLat, userLon, radius = 50) {
  if (!bottle?.location) return false
  const { lat, lon } = bottle.location
  const toRad = x => (x * Math.PI) / 180
  const R = 6371000 // m
  const dLat = toRad(lat - userLat)
  const dLon = toRad(lon - userLon)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(userLat)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLon / 2) ** 2
  const dist = 2 * R * Math.asin(Math.sqrt(a))
  return dist <= radius
}


async function openBottle(bottle) {
  /* aktuelle Nutzerkoordinate holen */
  navigator.geolocation.getCurrentPosition(pos => {
    const ok = canOpenBottle(
      bottle,
      pos.coords.latitude,
      pos.coords.longitude
    )
    if (!ok) {
      alert("Du bist zu weit entfernt, um diese Bottle zu öffnen.")
      return
    }
    // jetzt offizielles Detail-Modal anzeigen
    viewAllBottleDetail(bottle)
  })
}
