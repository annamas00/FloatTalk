<template>
  <div class="map-wrapper">
    <!-- MAP -->
    <div id="map"></div>

    <!-- Floating Buttons -->
    <div class="fab-container">
      <button @click="showChatModal = true" class="fab bg-white text-gray-700">
        <MessageSquareMore />
      </button>
      <button @click="prepareThrowForm" class="fab bg-indigo-600 text-white">
        <Send />
      </button>
      <button @click="$router.push('/profile')" class="fab bg-white text-gray-700">
        <UserCircle />
      </button>
    </div>

    <!-- Throw Bottle Modal -->
    <div v-if="showForm" class="form-modal z-50">
      <div class="form-box">
        <h3 class="text-lg font-bold mb-3">New Bottle</h3>
        <textarea v-model="bottleContent" placeholder="Write your message..." class="input mb-2"></textarea>

        <!-- Tag Input -->
        <div class="tag-input mb-2">
          <div v-for="(tag, index) in tagList" :key="index" class="tag-chip">
            {{ tag }}
            <span class="tag-close" @click="removeTag(index)">×</span>
          </div>
          <input v-model="tagInput" @keydown="handleTagKeydown" placeholder="Add tags" class="input-tag" />
          <!-- Visibility Range -->
          <label class="block mb-1 text-sm font-medium">Visible within: {{ visibilityKm }} km</label>
          <input type="range" v-model="visibilityKm" min="1" max="10" step="1"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-4" />

          <!-- Max Readers -->
          <label class="block mb-1 text-sm font-medium">Max people who can read it (optional)</label>
          <input type="number" v-model="maxReaders" placeholder="e.g. 3" class="input mb-4" min="1" />

        </div>

        <input v-model="location" placeholder="Enter location" class="input mb-4" />

        <div class="flex justify-end space-x-2">
          <button class="btn-cancel" @click="showForm = false">Cancel</button>
          <button class="btn-submit" @click="submitBottle()">Send</button>
        </div>
      </div>
    </div>

    <!-- Chat Modal -->
    <div v-if="showChatModal" class="form-modal z-50">
      <div class="form-box">
        <div class="form-header">
          Conversations
          <button @click="showChatModal = false" class="text-xl absolute right-4">✕</button>
        </div>

        <div class="form-content">
          <div class="form-left">
            <div class="chat-button" v-for="chat in chatList" :key="chat.conversation_id">
              <button @click="openConversation(chat.conversation_id)" class="w-full text-left">
                <div class="chat-info-wrapper">
                  <p v-if="chat.first_message" class="chat-info-text">
                    {{chat.participants.map(p => p.nickname).join(', ')}}<br />
                    {{ formatDate(chat.first_message.timestamp) }}
                  </p>
                  <p class="chat-preview">
                    {{
                      chat.bottle_sender?.nickname ||
                      chat.bottle_sender?.user_id ||
                      'Unknown'
                    }}:
                    {{
                      chat.preview || chat.first_message?.content
                    }}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Send, MessageSquareMore, UserCircle } from 'lucide-vue-next'
import useMap from './useMap.js'
import { useChatLogic } from './chatLogic.js'

import {
  showForm,
  bottleContent,
  location,
  submitBottle,
  tagList,
  tagInput,
  handleTagKeydown,
  removeTag,
  prepareThrowForm
} from './throwBottleLogic.js'

const { initMap, loadNearbyBottles, locateUserAndLoadBottles } = useMap()
const visibilityKm = ref(5)
const maxReaders = ref(null)
const {
  showChatModal,
  chatList,
  openConversation,
  formatDate,
  loadChatList
} = useChatLogic()

onMounted(async () => {
  await nextTick()
  await initMap('map')
  await loadChatList()
  await locateUserAndLoadBottles()
})
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

#map {
  height: 100%;
  width: 100%;
  position: absolute;
  inset: 0;
  z-index: 0;
}

.fab-container {
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  z-index: 1000;
  pointer-events: none;
}

.fab {
  pointer-events: auto;
  width: 3.25rem;
  height: 3.25rem;
  padding: 0.75rem;
  border-radius: 9999px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  text-decoration: none;
  font-size: 1rem;
  line-height: 1;
  box-sizing: border-box;
  opacity: 1;
  /* prevent translucency */
}

.fab.router-link-active,
.fab.router-link-exact-active,
.fab:visited,
.fab:link {
  all: unset;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 3.25rem;
  height: 3.25rem;
  padding: 0.75rem;
  border-radius: 9999px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-box {
  background: white;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.form-box {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 90%;
  margin: 0 auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}


.close-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #ccc;
  border-radius: 0.5rem;
}
</style>
