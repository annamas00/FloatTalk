import { ref } from 'vue'
import axios from 'axios'
import { fetchMyBottles } from './myBottlesLogic.js'
import { getUserId } from './replyLogic.js'

export const showForm = ref(false)
export const bottleContent = ref('')
export const location = ref('')
export const tagList = ref([])
export const tagInput = ref('')
export const city = ref('')
export const showSuccessModal = ref(false)
export const ttlMinutes = ref(60)    //30, 60, 240, 1440
export const maxReaders = ref(null)  //null = no limit
export const visibilityKm = ref(5)   //1..10

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// Reverse Geocoding for automatic localization
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`${API_BASE}/api/reverse?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const a = data.address || {}
    const street = [a.road, a.house_number].filter(Boolean).join(' ');
    const locText = [street, a.postcode, a.city || a.town || a.village, a.country]
      .filter(Boolean)
      .join(', ');

    // Update location + localStorage
    location.value = locText
    city.value = (a.city || a.town || a.village || '')
    localStorage.setItem('userLocationText', locText)
    localStorage.setItem('userLat', lat)
    localStorage.setItem('userLon', lon)

  } catch (err) {
    console.error('❌ Error in Reverse Geocoding:', err)
  }
}

//adds tags 
export function addTag() {
  const value = tagInput.value.trim()
  if (
    value &&
    !tagList.value.includes(value) &&
    tagList.value.length < 5 // max tags
  ) {
    tagList.value.push(value)
  } else {
    console.warn('⚠️ Tag NOT added. Value:', value)
  }
  tagInput.value = ''
}

//handles the key presses inside tag input field
//If the user presses enter/space/comma a tag is added
export function handleTagKeydown(e) {
  const key = e.key
  if (
    (key === 'Enter' || key === ' ' || key === 'Space' || key === ',' || key === 'Comma') &&
    !e.isComposing
  ) {
    e.preventDefault()
    addTag()
  }
}

export function removeTag(index) {
  tagList.value.splice(index, 1)
}

//submit a new bottle
export async function submitBottle(refreshNearby) {
  const allowedTTLs = new Set([30, 60, 240, 1440])
  const ttl = Number(ttlMinutes?.value ?? 60)
  const ttlMinutesPayload = allowedTTLs.has(ttl) ? ttl : 60
  const visibilityKmPayload = Number(visibilityKm?.value ?? 5) || 5
  const parsedMax = Number.parseInt(maxReaders.value, 10);
  const maxReadersPayload = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : null;
  const storedLat = localStorage.getItem('userLat')
  const storedLon = localStorage.getItem('userLon')
  const storedCoords = localStorage.getItem('coords')

  localStorage.setItem('lastBottleLat', storedLat)
  localStorage.setItem('lastBottleLon', storedLon)

  if (!bottleContent.value || !location.value) {
    console.warn('no locations')
    return
  }
  //dont send bottle if in max readers entered 0
  if (maxReaders.value === 0) {
    return 
  }

  try {
    const res = await axios.post(`${API_BASE}/add_bottle`, {
      bottle_id: "btl_" + Date.now(),
      sender_id: getUserId(),
      content: bottleContent.value,
      tags: tagList.value,
      location: storedLat && storedLon
        ? {
          lat: parseFloat(storedLat),
          lon: parseFloat(storedLon),
          address: location.value,
        }
        : JSON.parse(storedCoords),
      city: city.value,
      max_readers: maxReadersPayload,
      ttl_minutes: ttlMinutesPayload,
      visibility_km: visibilityKmPayload,
    })

    if (res.data.status === 'texterror') {
      alert('❌ Text error: ' + res.data.message);
      return;
    }

    //expiry time -> refresh list
    if (res.data.visible_until) {
      const msLeft = new Date(res.data.visible_until).getTime() - Date.now()
      if (msLeft > 0) {
        setTimeout(() => {
          if (typeof refreshNearby === 'function') refreshNearby()
        }, msLeft)
      }
    }
    
    // refresh form
    showForm.value = false
    bottleContent.value = ''
    showSuccessModal.value = true
    location.value = ''
    tagList.value = []
    tagInput.value = ''
    maxReaders.value = null
    if (ttlMinutes) ttlMinutes.value = 60
    if (visibilityKm) visibilityKm.value = 5
    if (refreshNearby) {
      await refreshNearby()
    }
    await fetchMyBottles()
    return res.data
  } catch (err) {
    console.error('❌ Submit failed:', err)
  }
}

//Prepares the "throw bottle" form by restoring a cached location if available or
//  by reverse-geocoding stored coordinates
export async function prepareThrowForm() {
  location.value = '' 
  city.value = ''

  const storedText = localStorage.getItem('userLocationText')
  const storedLat = localStorage.getItem('userLat')
  const storedLon = localStorage.getItem('userLon')
  const storedCoords = localStorage.getItem('coords')

  if (storedText) {
    location.value = storedText
  } else if (!isNaN(storedLat) && !isNaN(storedLon)) {
    await reverseGeocode(storedLat, storedLon)
  } else if (storedCoords) {
    const { lat, lon } = JSON.parse(storedCoords)
    await reverseGeocode(lat, lon)
  }
  showForm.value = true
}


// Haversine & distance Check
export function canOpenBottle(bottle, userLat, userLon, radius = 50) {
  if (!bottle?.location) return false
  const { lat, lon } = bottle.location
  const toRad = deg => (deg * Math.PI) / 180
  const R = 6371000          // Earth radius in m
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

//open bottle
export function openBottle(bottle, onSuccess) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      const near = canOpenBottle(
        bottle,
        pos.coords.latitude,
        pos.coords.longitude
      )
      if (!near) {
        alert('🚫 You are too far away.')
        return
      }
      onSuccess && onSuccess(bottle) 
    },
    err => {
      console.warn('Geolocation error:', err)
      alert('Location couldnt be located.')
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}
