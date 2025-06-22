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

          <button @click="showChatModal = true" class="btn-action">
            💬 Chat
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

<!-- Chat List Modal -->
  <div v-if="showChatModal" class="form-modal">
    <div class="form-box">
      <h3 class="text-lg font-bold mb-3" >Chat List</h3>  
      <button @click="showChatModal = false" class="absolute top-3 right-3">✕</button> 
      <div v-for="chat in chatList" :key="chat.conversation_id" class="mb-6 border-b pb-2">       
        <button 
          @click="openConversation(chat.conversation_id)"
        >
           <p class="text-black">💬 {{ chat.participants[0] }} and {{ chat.participants[1] }}</p>      
          <p v-if="chat.first_message">
            ⏰ {{ formatDate(chat.first_message.timestamp) }}
            <br />
            👤 {{ chat.first_message.sender_id }}：🍼 {{ chat.first_message.content }}
          </p>
        </button>
      </div>
    </div>
  

    <!-- Chat Detail Modal -->
    <div v-if="showChatDetailModal" class="form-box">
      <div class="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-lg max-h-[80vh] overflow-auto">
        <h2 class="text-xl font-bold mb-4 text-center">Chat history</h2>
        <button @click="showChatDetailModal = false" class="absolute top-4 right-4 text-black text-sm">✕</button>
        <div v-for="msg in messageList" :key="msg.timestamp" class="mb-4">
          <p><strong>{{ msg.sender_id }}:</strong> {{ msg.content }}</p>
          <p class="text-xs text-black">{{ formatDate(msg.timestamp) }}</p>
        </div>
      </div>

         <!-- Reply Button -->
        <!--   <div class="dialog-reply mt-4">
            <div v-if="!showReplyInput" class="flex justify-end">
              <button class="btn-submit" @click="toggleReplyBox(currentBottleId)">Reply</button>
            </div>

            <div v-else>
              <textarea v-model="replyContent" class="reply-input" placeholder="Write a reply..."></textarea>
              <div class="flex justify-end mt-2 space-x-2">
                <button class="btn-cancel" @click="cancelReply">Cancel</button>
                <button class="btn-submit" @click="sendReply({ bottle_id: currentBottleId } )">Send</button>
              </div>
            </div>
          </div>  -->
          
    </div>
  </div>

          <!-- All Bottles dropdown -->
          <div class="w-full mt-4">
            <button @click="toggleAllDropdown" class="btn-action w-full flex justify-between items-center">
              <span>All Bottles</span>
              <span>{{ allDropdownOpen ? '▲' : '▼' }}</span>
            </button>

            <div v-if="allDropdownOpen" class="dropdown-list">
              <div
                v-for="(bottle, index) in allBottles"
                :key="index"
                class="dropdown-item"
                @click="viewAllBottleDetail(bottle)"
              >
                {{ bottle && bottle.content ? bottle.content.slice(0, 20) : '[No Content]' }}
              </div>
            </div>
          </div>

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
          </div>
        </div>
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
       
        <div class="w-full mt-4">
          <button @click="toggleDropdown" class="btn-action w-full flex justify-between items-center">
            <span>my Bottles</span>
            <span>{{ dropdownOpen ? '▲' : '▼' }}</span>
          </button>

          <div v-if="dropdownOpen" class="dropdown-list">
              <div
                v-for="(bottle, index) in myBottles"
                :key="index"
                class="dropdown-item"
                @click="viewBottleDetail(bottle)"
              >
                {{ bottle.content.slice(0, 20) }}...
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
import { Send, BookOpen, UserCircle, MessageSquareMore } from 'lucide-vue-next'


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
onMounted(() => {

  fetchAllBottles()
})


onMounted(() => {
  loadChatList();
});

import {
  selectedBottle as selectedAllBottle,
  allDetailVisible,
  viewAllBottleDetail,
  closeDetailModal as closeAllDetailModal,
  allBottles,
  fetchAllBottles,
  allDropdownOpen,
  toggleAllDropdown
} from './allBottlesLogic.js'

import {
  showReplyInput,
  replyContent,
 
  toggleReplyBox,
  cancelReply,messageHistory, 
  loadMessageHistory ,
  sendReply
} from './replyLogic.js'


import { computed } from 'vue'


import { watch} from 'vue'
import { useChatLogic } from './chatLogic.js'

const userId = 'user_test01' // 替换为真实用户ID
const {
  showChatModal,
  showChatDetailModal,
  chatList,
  selectedConversation,
  messageList,
  loadChatList,
  openConversation,
  formatDate
} = useChatLogic(userId)

onMounted(() => {
  loadChatList()
})

const getReceiverId = () => {
  const conv = chatList.value.find(c => c.conversation_id === selectedConversation.value)
  return conv?.participants.find(p => p !== userId)
}

onMounted(() => loadChatList())





function formatTimestamp(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString()
}

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
  background: rgb(253, 253, 253);
  padding: 0 1.5rem 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  max-height: 400px;
  overflow-y: auto;  
  color: black
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
  top: 0; left: 0;
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
  top: 0; left: 0;
  width: 100vw; height: 100vh;
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
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
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
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-size: 1rem;
  box-sizing: border-box;
}


.chat-popup {
  position: fixed;
  right: 5%;
  top: 10%;
  background: white;
  padding: 1rem;
  border-radius: 10px;
  width: 360px;
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
}



.dialog-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-box {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 420px;  /* 加这一行很关键 */
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  position: relative;
  margin: auto;      /* 加这一行确保它水平居中 */
}

</style>
