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
export const userId = localStorage.getItem('user_id')


function capitalizeWords(str) {
  return str
    .toLocaleLowerCase('de-DE') // erst alles klein (inkl. Ü → ü)
    .replace(/\b\p{L}+/gu, (word) =>
      word.charAt(0).toLocaleUpperCase('de-DE') + word.slice(1)
    )
}




export function showThrowBottleForm() {
  // showForm.value = true
prepareThrowForm()
  // Hole aktuelle Daten aus localStorage neu
  const storedLat = localStorage.getItem('userLat')
  const storedLon = localStorage.getItem('userLon')
  const storedCoords = localStorage.getItem('coords')
  const storedText = localStorage.getItem('userLocationText')

  // Koordinaten zurücksetzen, falls neu gesetzt wurde
  if (storedText) {
    location.value = storedText
  } else if (storedLat && storedLon) {
    reverseGeocode(parseFloat(storedLat), parseFloat(storedLon))
  } else if (storedCoords) {
    const { lat, lon } = JSON.parse(storedCoords)
    reverseGeocode(lat, lon)
  }
}




// Reverse-Geocoding für automatische Standortermittlung
async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    )
    const data = await response.json()
const address = data.address || {}
    const road = address.road || ''
    const cityName = address.city || address.town || address.village || ''
    
    // Wenn Straße vorhanden → Straße + Stadt, sonst nur Stadt
    const locationText = road
      ? `${capitalizeWords(road)}, ${capitalizeWords(cityName)}`
      : capitalizeWords(cityName)

    // Update location + localStorage
    location.value = locationText
    city.value = capitalizeWords(cityName)
    localStorage.setItem('userLocationText', locationText)
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


  try {
    const res = await axios.post("http://localhost:8000/add_bottle", {
      bottle_id: "btl_" + Date.now(),
      sender_id: userId,
      content: bottleContent.value,
      tags: tagList.value,
      location: storedLat && storedLon
      ? {
          lat: parseFloat(storedLat),
          lon: parseFloat(storedLon)
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
}


export function prepareThrowForm() {
  
  location.value = '' // alten Wert löschen
  city.value = ''

  // 🔁 Zuerst versuchen, alten Standorttext wiederherzustellen
const storedText = localStorage.getItem('userLocationText')
if (storedText) {
  location.value = storedText
  return // keine Neuberechnung nötig
}
  //localStorage.removeItem('userLocationText')
  // localStorage.removeItem('coords') // optional

  const storedLat = localStorage.getItem('userLat')
  const storedLon = localStorage.getItem('userLon')
  const storedCoords = localStorage.getItem('coords')



  //if (storedText) {
    //location.value = storedText
  //} else
   if (storedLat && storedLon) {
    reverseGeocode(parseFloat(storedLat), parseFloat(storedLon))
  } else if (storedCoords) {
    const { lat, lon } = JSON.parse(storedCoords)
    reverseGeocode(lat, lon)
  }

  showForm.value = true
}


