<template>
  <div class="grid-container">
    <div class="map-container" id="map"></div>

    <div class="sidebar">
      <!-- link sidebar -->


     

     <div class="function-button">
  <div class="flex-icon-group">
    <router-link to="/profile" class="profile-btn" title="Profile">
      <UserCircle class="w-7 h-7" />
    </router-link>

    <button @click="prepareThrowForm" class="btn-action">
      <div class="btn-inner">
        <Send class="w-5 h-5" />
      </div>
    </button>

    <button @click="showChatModal = true" class="btn-action">
      <div class="btn-inner">
        <MessageSquareMore class="w-5 h-5" />
      </div>
    </button>

   <button @click="showMyBottleModal = true" class="btn-action">
  <div class="btn-inner">
    <Mails class="w-5 h-5" />
  </div>
</button>

  
</div>

      
      

      </div>
      <!-- user -->
      <div class="flex justify-center pb-4">
        <!-- <div class="flex justify-center pb-4">
          <router-link to="/profile" class="profile-btn" title="Profile">
            <UserCircle class="w-7 h-7" />
          </router-link>
        </div> -->


<!-- My Bottles Modal -->
<div v-if="showMyBottleModal" class="form-modal">
  <div class="form-box">
    <div class="form-header">
      <Mails class="w-5 h-5" />
      <h2 class="dialog-title"> Bottle Detail</h2>
      <button @click="showMyBottleModal = false" class="text-xl absolute right-4">✕</button>
    </div>

    <div class="mybottle-content">
   
        <div class="chat-button" v-for="bottle in myBottles" :key="bottle.bottle_id">
         
            <div class="chat-info-wrapper">
              <p class="dialog-tags">
                <CalendarFold class="w-4 h-4" />
                {{  formatDate(bottle.timestamp)}} 
              </p>

               <div class="dialog-tags" >
               <div v-if="bottle.tags?.length" class="flex items-center gap-1 text-sm text-gray-600">
                  <Tag class="w-4 h-4" />
                  {{ bottle.tags.join(', ') }}
              </div>

              </div>
            </div>
            <div class="dialog-content">
            <p class="bottle-details">{{ bottle.content.slice(0, 30) }}</p>
            </div>
        </div>
      
    </div>
  </div>
</div>


        <!-- new windows -->
        <div v-if="showForm" class="form-modal">
          <div class="form-box">
           
            <h3 class="text-lg font-bold mb-3">New Bottle</h3>

            <textarea v-model="bottleContent" placeholder="Write your message..." class="input mb-2"></textarea>
            <!-- taginpuit -->
            <div class="tag-input mb-2">
              <div v-for="(tag, index) in tagList" :key="index" class="tag-chip">
                {{ tag }}
                <span class="tag-close" @click="removeTag(index)">×</span>
              </div>
              <input v-model="tagInput" @keydown="handleTagKeydown" placeholder="Add tags" class="input-tag" />
            </div>
            <input v-model="location" placeholder="Enter location" class="input mb-4" :readonly="isAutoDetected" />

            <!-- Sichtbarkeitsdauer der Bottle -->
            <label class="block mb-1 text-sm font-medium">Visible for:</label>
            <select v-model="ttlMinutes" class="input mb-2">
              <option :value="30">30 minutes</option>
              <option :value="60">1 hour</option>
              <option :value="240">4 hours</option>
              <option :value="1440">24 hours</option>
            </select>
            <!-- Visibility Radius -->
            <label class="block mb-1 text-sm font-medium">Visible within: {{ visibilityKm }} km</label>
            <div class="relative w-full">
              <input type="range" v-model="visibilityKm" min="1" max="10" step="1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            </div>
            <label class="block mb-1 text-sm font-medium">Limit readers (optional):</label>
            <input type="number" v-model="maxReaders" min="1" placeholder="e.g. 3" class="input mb-4" />
            <div class="flex justify-end space-x-2">
              <button class="btn-cancel" @click="showForm = false">Cancel</button>
              <button class="btn-submit" @click="submitBottle(loadNearbyBottles)">Send</button>
            </div>
          </div>
        </div>
        <div v-if="showSuccessModal" class="modal-overlay">
          <div class="modal">
            <h2 class="text-lg font-semibold mb-4">📦 Bottle thrown successfully!</h2>
            <p class="mb-4">Your message has been thrown and saved on the map.</p>
            <button @click="goToMap" class="btn-action">Go back to map</button>
          </div>
        </div>

        <!-- Chat List Modal -->
        
    <div v-if="showChatModal" class="form-modal">
            <div class="form-box">
              
            
              <div class="form-header">
<MessageSquareMore class="w-5 h-5" />
                Chat
                <button @click="showChatModal = false" class="text-xl absolute right-4">✕</button>
              </div>

             
              <div class="form-content">
                
                
                <div class="form-left">

                  <button @click="openConversation(chat.conversation_id)" class="chat-button" v-for="chat in chatList" :key="chat.conversation_id">
                    
                    
                
                      <div class="chat-info-wrapper">
                        <p v-if="chat.first_message" class="chat-info-text">
                          {{ chat.participants.map(p => p.nickname).join(', ') }}<br>
                          {{ formatDate(chat.first_message.timestamp
                          ) }}
                        </p>
                      </div>
                      <p class="chat-preview">
                        {{ chat.bottle_sender?.nickname || chat.bottle_sender?.user_id || 'Unknown' }}: {{ chat.preview }}
                      </p>
                    
                  </button>
                </div>

              <!-- .form-right -->
                  <div class="form-right" v-if="showChatDetailModal">
                   
                    <div class="form-right-header">
                     
                     <Handshake class="w-5 h-5" />
                      
                    </div>

                <div class="form-right-content">
                  <div id="chat-messages" ref="chatMessagesRef"
                    class="chat-messages"
  style="max-height: 400px; min-height: 200px; overflow-y: auto;">
                    <div v-for="msg in messageList" :key="msg.timestamp" :class="[
                      'chat-message',
                      msg.sender_id === userId ? 'self-message' : 'other-message'
                    ]">
                      <div class="chat-bubble">
                        <p class="text-xs text-gray-500 mb-1">{{ formatDate(msg.timestamp) }}</p>
                        <p><strong>{{ msg.sender_nickname }}:</strong> {{ msg.content }}</p>
                      </div>
                    </div>
                  </div>
</div>

                  <div class="form-right-reply">
                    <div class="form-right-reply-blank">
                      <textarea v-model="replyContent" class="reply-input" placeholder="Write a reply..."></textarea>
                    </div>
                    <div class="form-right-reply-button">
                      <button class="btn-submit" @click="handleSendReply">Send</button>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>


        <!-- All Bottles dropdown -->
       <!--  <div class="w-full mt-4">
          <button @click="toggleAllDropdown" class="btn-action w-full flex justify-between items-center">
            <span>All Bottles</span>
            <span>{{ allDropdownOpen ? '▲' : '▼' }}</span>
          </button>

          <div v-if="allDropdownOpen" class="dropdown-list">
            <div v-for="(bottle, index) in allBottles" :key="index" class="dropdown-item" @click="showBottle(bottle)">
              {{ bottle && bottle.content ? bottle.content.slice(0, 20) : '[No Content]' }}
            </div>
          </div>
        </div> -->

          <!-- All Bottle Detail Modal -->
          <div v-if="allDetailVisible" class="dialog-overlay">
            <div class="dialog-box text-black">
              <div class="dialog-header">
                <h2 class="dialog-title">📦 Bottle Detail</h2>
                <button class="dialog-close" @click="closeAllDetailModal">×</button>
              </div>

              <div class="dialog-body">
                <p class="dialog-content">{{ selectedAllBottle?.content }}</p>
                <div class="dialog-tags" v-if="selectedAllBottle?.tags">
                  <span v-for="(tag, idx) in selectedAllBottle.tags" :key="idx" class="tag-chip">
                    {{ tag }}
                  </span>
                </div>

              <!-- Reply Button -->
              <div class="dialog-reply mt-4">
                <div v-if="!showReplyInput" class="flex justify-end">
                  <button class="btn-submit" @click="toggleReplyBox(selectedAllBottle?.bottle_id)">Reply</button>
                </div>
                <div v-else>
                  <textarea v-model="replyContent" class="reply-input" placeholder="Write a reply..."></textarea>
                  <div class="flex justify-end mt-2 space-x-2">
                    <button class="btn-cancel" @click="cancelReply">Cancel</button>
                    <button class="btn-submit" @click="sendReply(selectedAllBottle)">Send</button>
                  </div>
                </div>
                <div v-if="showSuccessModal" class="modal-overlay">
                 <div class="modal">
                  <h2 class="text-lg font-semibold mb-4">📦 Bottle thrown successfully!</h2>
                  <p class="mb-4">Your message has been thrown and saved on the map.</p>
                  <button @click="goToMap" class="btn-action">Back</button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showReplySuccessModal" class="modal-overlay">
        <div class="modal">
          <h2 class="text-lg font-semibold mb-4">📦 Reply sent successfully!</h2>
          <p class="mb-4">Your reply was saved.</p>
          <button @click="goToMapReply" class="btn-action">Go back to map</button>
        </div>
      </div>

          <!-- check my bottle -->
          <div v-if="detailVisible" class="dialog-overlay">
            <div class="dialog-box">
              <div class="dialog-header">
                <h2 class="dialog-title">📩 Bottle Detail</h2>
                <button class="dialog-close" @click="closeDetailModal">×</button>
              </div>
              <div class="dialog-body">
                <p class="dialog-content">
                  {{ selectedBottle && selectedBottle.content }}
                </p>

                <div class="dialog-tags" v-if="selectedBottle && selectedBottle.tags">
                  <span v-for="(tag, idx) in selectedBottle.tags" :key="idx" class="tag-chip">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Dropdown toggle button -->

      <!--   <div class="w-full mt-4">
          <button @click="toggleDropdown" class="btn-action w-full flex justify-between items-center">
            <span>my Bottles</span>
            <span>{{ dropdownOpen ? '▲' : '▼' }}</span>
          </button>

          <div v-if="dropdownOpen" class="dropdown-list">
            <div v-for="(bottle, index) in myBottles" :key="index" class="dropdown-item"
              @click="viewBottleDetail(bottle)">
              {{ bottle.content.slice(0, 20) }}...
            </div>
          </div>
        </div> -->

       
      </div>
              <div class="icon">
                 <Waves class="w-5 h-5" />
                  Float
                  Talk
              </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, nextTick, ref, watch } from 'vue'
import L, { icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import markerIcon2x from '../assets/leaflet/marker-icon-2x.png'
import markerIcon from '../assets/leaflet/marker-icon.png'
import markerShadow from '../assets/leaflet/marker-shadow.png'
import { Send, BookOpen, UserCircle, MessageSquareMore,Mails,Bird,Tag,CalendarFold,Handshake, Waves} from 'lucide-vue-next'
import { ttlMinutes } from './throwBottleLogic.js'
import * as turf from '@turf/turf'
import bottleIconUrl from '../assets/leaflet/bottle.png'


const bottleIcon = L.icon({
  iconUrl: bottleIconUrl,
  iconSize: [32, 32],         // 32x32 Pixel
  iconAnchor: [16, 32],       // Mittelpunkt unten
  popupAnchor: [0, -32]       // Popup-Position
})


const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:8000'


const isAutoDetected = ref(false)
const visibilityKm = ref(5)
const maxReaders = ref(null)
const showMyBottleModal = ref(false)
const chatMessagesRef = ref(null)

// ---------------------------------------------
// Hilfs‐Array, damit wir alte Marker löschen
// ---------------------------------------------
const allBottleMarkers = []
const userLat = ref(null)
const userLon = ref(null)


import {
  showForm,
  bottleContent,
  location,
  submitBottle,
  tagList,
  tagInput,
  removeTag,
  handleTagKeydown,
  prepareThrowForm,
  showSuccessModal,
  openBottle
} from './throwBottleLogic.js'

import {
  myBottles,
  dropdownOpen,
  toggleDropdown,
  viewBottleDetail,
  detailVisible,
  selectedBottle,
  closeDetailModal,
  fetchMyBottles
} from './myBottlesLogic.js'

onMounted(() => {

  fetchMyBottles()
})
//onMounted(() => {

//fetchAllBottles()
//})


onMounted(() => {
  loadChatList();
});

import {
  selectedBottle as selectedAllBottle,
  allDetailVisible,
  showBottle,
  closeDetailModal as closeAllDetailModal,
  allBottles,
  //fetchAllBottles,
  allDropdownOpen,
  toggleAllDropdown
} from './allBottlesLogic.js'

import {
  showReplyInput,
  replyContent,
  toggleReplyBox,
  cancelReply,
  sendReply2,
  sendReply,
  showReplySuccessModal
} from './replyLogic.js'

//import { computed } from 'vue'

import {
  useChatLogic
} from './chatLogic.js'


onMounted(() => {
  console.log('👀 chatMessages DOM:', chatMessagesRef.value)
})


const {
  showChatModal,
  showChatDetailModal,
  chatList,
  selectedConversation,
  messageList,
  loadChatList,
  openConversation,
  formatDate,
  userId,
  currentBottleId
} = useChatLogic(chatMessagesRef)

onMounted(() => {
  loadChatList()
})

const getReceiverId = () => {
  const conv = chatList.value.find(c => c.conversation_id === selectedConversation.value)
  return conv?.participants.find(p => p !== userId)
}

onMounted(() =>
  loadChatList()
)

onMounted(async () => {
  /* Karte wie gehabt initialisieren … */

  /* ------------------------------------
     1)   Koordinate vom Nutzer holen
  ------------------------------------ */
  navigator.geolocation.getCurrentPosition(
    async pos => {
      userLat.value = pos.coords.latitude
      userLon.value = pos.coords.longitude
      localStorage.setItem('userLat', userLat.value)
      localStorage.setItem('userLon', userLon.value)


      isAutoDetected.value = true
      const lat = parseFloat(localStorage.getItem('userLat'))
      const lon = parseFloat(localStorage.getItem('userLon'))

      //Marker „Your Location“
      L.marker([userLat.value, userLon.value])
        .addTo(mapInstance)
        .bindPopup('📍 Your Location')
        .openPopup()

      // 1. Innerer weißer Kreis
      const whiteCircle = L.circle([lat, lon], {
        radius: 5000,
        color: 'black',
        fillColor: 'transparent',
        fillOpacity: 1,
        weight: 2
      }).addTo(mapInstance)

      // 2. Welt-Polygon mit Loch (graue Fläche außen)
      const world = turf.polygon([
        [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90],
          [-180, -90]
        ]
      ])


      //Kreis um den Nutzerstandort als "Loch" definieren (5 km Radius)
      const hole = turf.circle([lon, lat], 5, {
        steps: 64,  // Auflösung des Kreises
        units: 'kilometers'
      })

      // Falls das ein MultiPolygon ist → in Polygon umwandelns
      let holePoly = hole
      if (hole.geometry.type === 'MultiPolygon') {
        const firstPoly = hole.geometry.coordinates[0]
        holePoly = turf.polygon(firstPoly, hole.properties)
      }

      // Maske erstellen: Alles außerhalb des 5-km-Kreises ausgrauen
      const masked = turf.mask(world, holePoly)

      //Graue Maske zur Karte hinzufügen
      L.geoJSON(masked, {
        style: {
          color: '#888',        //randfarbe
          weight: 0,            //kein rand
          fillColor: '#ddd',    //hellgrau
          fillOpacity: 0.5      // 0 = komplett transparent, 1 = undurchsichtig
        }
      }).addTo(mapInstance)


      // ---------------------------------
      // 2)   Nur Bottles im 5-km-Umkreis:
      // ---------------------------------
      await loadNearbyBottles()
    },
    err => console.warn('Geolocation-Error', err),
    { enableHighAccuracy: true, timeout: 10000 }
  )
})



console.log('🧪 showReplySuccessModal at mount:', showReplySuccessModal.value)



function formatTimestamp(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString()
}

const map = ref(null)
let mapInstance = null
let markers = []

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

onMounted(async () => {

  await nextTick()
  const mapContainer = document.getElementById('map')
  if (!mapContainer) {
    console.error('❌ Map container not found!')
    return
  }

  if (!mapInstance) {
    mapInstance = L.map(mapContainer).setView([48.1351, 11.5820], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance)
    map.value = mapInstance
  } else {
    console.warn('⚠️ Map is already initialized')
  }


  await loadBottles()
  // 📍 Standort aus localStorage holen
  const savedLat = localStorage.getItem('userLat')
  const savedLon = localStorage.getItem('userLon')


  if (savedLat && savedLon) {
    const lat = parseFloat(savedLat)
    const lon = parseFloat(savedLon)
    // Marker und Zoom setzen
    const marker = L.marker([lat, lon])
      .addTo(mapInstance)
      .bindPopup('📍 Your Location')
      .openPopup()

    mapInstance.setView([lat, lon], 13)
  }

  const query = new URLSearchParams(window.location.search)
  const queryLat = query.get('lat')
  const queryLon = query.get('lon')
  const msg = query.get('msg')
  const storedCoords = localStorage.getItem('coords' || '{}')

  if (queryLat && queryLon && msg) {
    const marker = L.marker([parseFloat(queryLat), parseFloat(queryLon)])
      .addTo(map.value)
      .bindPopup(`<strong>📦 New Bottle:</strong><br/>${msg}`)
      .openPopup()

    mapInstance.setView([parseFloat(queryLat), parseFloat(queryLon)], 14)
    window.history.replaceState({}, document.title, '/')
  }
})

function goToMap() {
  showSuccessModal.value = false

  const lat = localStorage.getItem('lastBottleLat')
  const lon = localStorage.getItem('lastBottleLon')

  if (lat && lon && mapInstance) {
    const coords = [parseFloat(lat), parseFloat(lon)]
    mapInstance.setView(coords, 16) // ⬅️ Zoom-Level auf Standort

    // Marker mit "New Bottle"
    L.marker(coords).addTo(mapInstance).bindPopup('📦 New Bottle').openPopup()
  }
}



// ---------------------------------------------
// 2)   Auf Änderungen reagieren
// ---------------------------------------------
watch(
  allBottles,
  bottles => {
    if (!mapInstance) return          // Karte noch nicht da?

    /* alte Marker entfernen */
    allBottleMarkers.forEach(m => mapInstance.removeLayer(m))
    allBottleMarkers.length = 0

    /* neue Marker zeichnen */
    bottles.forEach(b => {
      const loc = b.location || {}
      if (!('lat' in loc && 'lon' in loc)) return

      const marker = L.marker([loc.lat, loc.lon], { icon: bottleIcon }).addTo(mapInstance)
        .bindPopup(`
  <small>Tags: ${(b.tags || []).join(', ')}</small><br/>
  <button onclick="window.replyToBottle('${b.bottle_id}')">💬 Reply</button>
`)


      allBottleMarkers.push(marker)
    })
  },
  { immediate: true }
)

window.replyToBottle = (bottleId) => {
  const bottle = allBottles.value.find(b => b.bottle_id === bottleId)
  if (!bottle) return alert('Bottle not found')

  selectedAllBottle.value = bottle
  allDetailVisible.value = true
  showReplyInput.value = false

}
//if (bottle) {
//viewBottleDetail(bottle)              // zeigt das Detailfenster
//toggleReplyBox(bottleId)              // öffnet das Reply-Feld
//} else {
//alert('Bottle not found')
//viewBottleDetail(bottle)            // öffnet das Modal
//nextTick(() => toggleReplyBox(bottleId)) // jetzt erst Eingabefeld
//}
//}

window.tryOpen = id => {
  const bottle = allBottles.value.find(b => b.bottle_id === id)
  if (bottle) {
    openBottle(bottle, toggleReplyBox)   // Callback öffnet Modal
  }
}

async function loadNearbyBottles() {
  if (userLat.value == null || userLon.value == null) return
  const res = await axios.get(
    `${API_BASE}/nearby_bottles`,
    { params: { lat: userLat.value, lon: userLon.value, radius: 5000 } }
  )
  allBottles.value = res.data.bottles        // aus deinem allBottles-Store
}



function goToMapReply() {
  showReplySuccessModal.value = false  // Modal schließen
  // Aktuelles Bottle-Ort holen
  const bottle = selectedAllBottle.value
  const loc = bottle?.location
  if (loc && mapInstance) {
    const coords = [loc.lat, loc.lon]
    mapInstance.setView(coords, 16)
    L.marker(coords,).addTo(mapInstance).bindPopup('📦 Reply sent here').openPopup()
  }

  allDetailVisible.value = false
}

onMounted(() => {
  console.log('Homepage mounted, chatMessages ref:', chatMessagesRef.value)
})

onMounted(() => {
  console.log('🔍 chatMessages ref onMounted:', chatMessagesRef)
  console.log('🔍 chatMessages.value:', chatMessagesRef.value)
})


function handleSendReply() {
  sendReply2(chatMessagesRef)
}

</script>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: 1fr 100px;
  height: 100vh;
  width: 100vw;
}

.map-container {
  height: 100%;
  width: 100%;
}

.sidebar {
  background-color: #b8bcc2;
  color: rgb(245, 239, 239);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.function-button {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column; 
}

.btn-action {
  width: 50px;
  height: 50px;
  border-radius: 9999px; 
  background-color: #c4c2d8;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-action:hover {
  background-color: #97999b;
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-icon-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; 
  align-items: center;
}

.profile-btn {
  background-color: #c4c2d8;
  padding: 0.5rem;
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

.profile-btn:hover {
  background-color: #97999b;
}

form-modal {
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
  background: rgb(253, 253, 253);
  padding: 0;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 90%;
  height: 70%;
  max-width: 1000px;
  max-height: 850px;
  overflow: hidden;
  color: black;
  display: flex;
  flex-direction: column;
}

.form-header {
  height: 5%;
  background-color: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  display: flex;
  flex-direction: row;
  text-align: left;
  font-weight: bold;
}

.form-content {
  height: 95%;
  display: flex;
  flex-direction: row;

}

.mybottle-content {
  height: 95%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.form-left {
  width: 30%;
  background-color: #d1cccc75;
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
}

.form-right {
  width: 70%;
  background-color: #d1cccc75;
  padding: 0;
  height: 100%;
  /*max-height: 650px;*/
  display: flex;
  flex-direction: column;
}

.form-right-header {
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
  background-color: #f4f4f4;
  text-align: left;
  font-weight: bold;
}

.form-right-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.form-right-reply {
  display: flex;
  height: auto;
  border-top: 1px solid #ddd;
  padding: 1rem;
}

.form-right-reply-blank {
  width: 80%;
}

.form-right-reply-button {
  width: 20%;
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
  resize: vertical;
  min-height: 100px;
}

.tag-input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  background-color: #f9f9f9;
  font-size: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
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


.dropdown-list {
  transition: all 0.2s ease-in-out;
}

.dropdown-item {
  color: white;
  font-size: 0.9rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-box {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  text-align: left;
}

.modal-title {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.modal-content {
  margin-bottom: 1.5rem;
}

.modal-actions {
  text-align: right;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-box {
  background-color: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 420px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  position: relative;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title {
  font-size: 1.2rem;
  font-weight: bold;
}

.dialog-close {
  font-size: 1.5rem;
  font-weight: bold;
  background: none;
  border: none;
  cursor: pointer;
}

.dialog-body {
  margin-top: 1rem;
}

.dialog-content {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.dialog-tags {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag-chip {
  background-color: #007bff;
  color: white;
  border-radius: 9999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
}

.dialog-box,
.dialog-title,
.dialog-content,
.dialog-tags,
.dialog-tags .tag-chip {
  color: black;
}


.dialog-tags .tag-chip {
  background-color: #e5e7eb;
  color: #111827;
}


.dropdown-item {
  color: #f9fafb;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #4b5563;
}

.reply-input {
  width: 100%;
  min-height: 60px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-size: 1rem;
  box-sizing: border-box;
}

/*thrownsuccessmodal*/


.modal {
  background-color: white;
  /* ❗ weißer Hintergrund */
  color: black;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  text-align: center;
}





.chat-popup {
  position: fixed;
  right: 5%;
  top: 10%;
  background: white;
  padding: 1rem;
  border-radius: 10px;
  width: 360px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}



.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-box {
  background-color: rgb(228, 226, 226);
  border-radius: 1rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  position: relative;
  margin: auto;

}

.chat-preview {
  font-size: 0.875rem;     
  color: #000000;          
  text-align: left;
}

.chat-info-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem; 
  color: rgb(255, 255, 255);
  text-align: left;
}

.chat-info-text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgb(0, 0, 0);
  text-align: left;
}

.chat-button {
  width: 90%;
  margin: 0 auto 1rem auto;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  text-align: left;  
}
.chat-info{
 
  background-color: white;
 
}
.chat-message {
  display: flex;
  margin-bottom: 0.75rem;
}


.self-message {
  justify-content: flex-end;
}

.other-message {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: 70%;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background-color: #e5e7eb;
  color: black;
  word-wrap: break-word;
}

.chat-messages {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding-right: 0.5rem;
}


.self-message .chat-bubble {
  background-color: #2fcc7048;
  color: black;
  border-bottom-right-radius: 0;
}

.other-message .chat-bubble {
  background-color: #8d89893a;
  color: black;
  border-bottom-left-radius: 0;
}
.bottle-details{
  text-align: center;
}
.icon{
  text-align: center;
}
</style>