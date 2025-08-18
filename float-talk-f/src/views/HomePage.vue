<!--Website Version-->
<template>
  <div v-if="!isMobile" class="grid-container">
    <div class="map-container" id="map"></div>

    <div class="sidebar">
      <!-- link sidebar -->

      <div class="function-button">
        <div class="flex-icon-group">
          <button @click="$router.push('/profile')" class="btn-action">
            <div class="btn-inner">
              <UserCircle />
            </div>
          </button>
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

        <!-- My Bottles Modal -->
        <div v-if="showMyBottleModal" class="form-modal">
          <div class="form-box2">
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
                    {{ formatDate(bottle.timestamp) }}
                  </p>
                  <div class="dialog-tags">
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
          <div class="form-box2">
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

            <!-- Visibility of bottle -->
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
            <!-- Limit readers -->
            <label class="block mb-1 text-sm font-medium">Limit readers (optional):</label>
            <input type="number" v-model.number="maxReaders" min="1" placeholder="e.g. 3" class="input mb-4"
              :class="{ 'border-red-500': maxReaders === 0 }" />
            <p v-if="maxReaders === 0" class="text-red-500 text-sm mt-1">
              ⚠️ The minimal number of readers is 1. Please insert valid value.
            </p>
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
            <button @click="goToMap" class="btn-submit w-full max-w-xs">Go back to map</button>
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
                 <button @click="openConversation(chat.conversation_id)" class="chat-button" v-for="chat in chatList"
                  :key="chat.conversation_id">
                  <div class="chat-info-wrapper">
                    <p v-if="chat.first_message" class="chat-info-text">
                      {{chat.participants.map(p => p.nickname).join(', ')}}<br>
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
                <div class="form-right-content" ref="chatMessagesRef">
                  <div v-for="msg in messageList" :key="msg.timestamp" :class="[
                    'chat-message',
                    String(msg.sender_id) === String(getUserId()) ? 'self-message' : 'other-message'
                  ]">
                    <div class="chat-bubble">
                      <p class="text-xs text-gray-500 mb-1">{{ formatDate(msg.timestamp) }}</p>
                      <p><strong>{{ msg.sender_nickname }}:</strong> {{ msg.content }}</p>
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
              <!-- Fall 1: Reply-Feld not open yet -->
              <div class="dialog-reply mt-4">
                <div v-if="!showReplyInput" class="flex justify-end">
                  <button class="btn-submit" @click="toggleReplyBox(selectedAllBottle?.bottle_id)"
                    :disabled="selectedAllBottle?.max_readers > 0 && selectedAllBottle?.readers_count >= selectedAllBottle?.max_readers">Reply
                  </button>
                  <div
                    v-if="selectedAllBottle?.max_readers > 0 && selectedAllBottle?.readers_count >= selectedAllBottle?.max_readers"
                    class="text-red-500 text-sm mt-2">
                    Limit reached: no more replies allowed.
                  </div>
                </div>
                <!-- Fall 2: Reply-Feld open -->
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
            <button @click="goToMapReply" class="btn-submit w-full max-w-xs">Go back to map</button>
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
      </div>
      <div class="icon">
        <Waves class="w-5 h-5" />
        Float
        Talk
      </div>
    </div>
  </div>




  <!--Mobile Version-->
  <div v-if="isMobile" class="mobile-layout">
    <div id="map" class="map-area"></div>
    <div class="mobile-button-bar">
      <button @click="$router.push('/profile')" class="mobile-btn">
        <UserCircle class="w-6 h-6 mx-auto" />
        <p class="text-xs">Profile</p>
      </button>
      <button @click="prepareThrowForm" class="mobile-btn">
        <Send class="w-6 h-6 mx-auto" />
        <p class="text-xs">Throw</p>
      </button>
      <button @click="showChatModal = true" class="mobile-btn">
        <MessageSquareMore class="w-6 h-6 mx-auto" />
        <p class="text-xs">Chat</p>
      </button>
      <button @click="showMyBottleModal = true" class="mobile-btn">
        <Mails class="w-6 h-6 mx-auto" />
        <p class="text-xs">My Bottles</p>
      </button>
    </div>

    <div v-if="showMyBottleModal" class="form-modal">
      <div class="form-box2">
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
                {{ formatDate(bottle.timestamp) }}
              </p>

              <div class="dialog-tags">
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
    <div v-if="showForm" class="form-modal">
      <div class="form-box2">

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

        <!-- Visibility time of bottle -->
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
        <!-- Limit readers -->
        <label class="block mb-1 text-sm font-medium">Limit readers (optional):</label>
        <input type="number" v-model.number="maxReaders" min="1" placeholder="e.g. 3" class="input mb-4"
          :class="{ 'border-red-500': maxReaders === 0 }" />
        <p v-if="maxReaders === 0" class="text-red-500 text-sm mt-1">
          ⚠️ The minimal number of readers is 1. Please insert valid value.
        </p>
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
        <button @click="goToMap" class="btn-submit w-full max-w-xs">Go back to map</button>
      </div>
    </div>
    <div v-if="showChatModal" class="form-modal">
      <div class="form-box">
        <div class="form-header">
          <MessageSquareMore class="w-5 h-5" />
          Chat
          <button @click="showChatModal = false" class="text-xl absolute right-4">✕</button>
        </div>
        <div class="form-content">
          <div class="form-left">

            <button @click="openConversation(chat.conversation_id)" class="chat-button" v-for="chat in chatList"
              :key="chat.conversation_id">
              <div class="chat-info-wrapper">
                <p v-if="chat.first_message" class="chat-info-text">
                  {{chat.participants.map(p => p.nickname).join(', ')}}<br>
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
              <!-- ← Back for mobile only -->
              <button @click="showChatDetailModal = false" class="mobile-back-btn only-mobile">← Back</button>

              <Handshake class="w-5 h-5" />
            </div>

            <div class="form-right-content" ref="chatMessagesRef">
              <div v-for="msg in messageList" :key="msg.timestamp" :class="[
                'chat-message',
                String(msg.sender_id) === String(getUserId()) ? 'self-message' : 'other-message'
              ]">
                <div class="chat-bubble">
                  <p class="text-xs text-gray-500 mb-1">{{ formatDate(msg.timestamp) }}</p>
                  <p><strong>{{ msg.sender_nickname }}:</strong> {{ msg.content }}</p>
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
          <!-- Fall 1: Reply-Feld not open yet -->
          <div class="dialog-reply mt-4">
            <div v-if="!showReplyInput" class="flex justify-end">
              <button class="btn-submit" @click="toggleReplyBox(selectedAllBottle?.bottle_id)" :disabled="selectedAllBottle?.max_readers > 0 &&
                selectedAllBottle?.readers_count >= selectedAllBottle?.max_readers">
                Reply
              </button>
              <div v-if="selectedAllBottle?.max_readers > 0 &&
                selectedAllBottle?.readers_count >= selectedAllBottle?.max_readers" class="text-red-500 text-sm mt-2">
                Limit reached: no more replies allowed.
              </div>
            </div>
            <!-- Fall 2: Reply-Feld open -->
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
        <button @click="goToMapReply" class="btn-submit w-full max-w-xs">Go back to map</button>
      </div>
    </div>
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
    <div v-if="showForm" class="form-modal">
      <div class="form-box2">

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

        <!-- Visibility time of bottle -->
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
    <div v-if="showChatModal" class="form-modal">
      <div class="form-box">


        <div class="form-header">
          <MessageSquareMore class="w-5 h-5" />
          Chat
          <button @click="showChatModal = false" class="text-xl absolute right-4">✕</button>
        </div>
        <div class="form-content">
          <div class="form-left">
            <button @click="openConversation(chat.conversation_id)" class="chat-button" v-for="chat in chatList"
              :key="chat.conversation_id">
              <div class="chat-info-wrapper">
                <p v-if="chat.first_message" class="chat-info-text">
                  {{chat.participants.map(p => p.nickname).join(', ')}}<br>
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
          <div class="form-right" :class="{ 'mobile-hidden': !showChatDetailModal }">

            <div class="form-right-header">
              <button @click="showChatDetailModal = false" class="mobile-back-btn only-mobile">← Back</button>

              <Handshake class="w-5 h-5" />

            </div>

            <div class="form-right-content" ref="chatMessagesRef">

              <div v-for="msg in messageList" :key="msg.timestamp" :class="[
                'chat-message',
                String(msg.sender_id) === String(getUserId()) ? 'self-message' : 'other-message'
              ]">
                <div class="chat-bubble">
                  <p class="text-xs text-gray-500 mb-1">{{ formatDate(msg.timestamp) }}</p>
                  <p><strong>{{ msg.sender_nickname }}:</strong> {{ msg.content }}</p>
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
  </div>
</template>

<script setup>
import { onMounted, nextTick, ref, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import markerIcon2x from '../assets/leaflet/marker-icon-2x.png'
import markerIcon from '../assets/leaflet/marker-icon.png'
import markerShadow from '../assets/leaflet/marker-shadow.png'
import { Send, UserCircle, MessageSquareMore, Mails, Tag, CalendarFold, Handshake, Waves } from 'lucide-vue-next'
import { watch } from 'vue'
import * as turf from '@turf/turf'
import bottleIconUrl from '../assets/leaflet/bottle.png'  //from https://www.flaticon.com/de/kostenloses-icon/flaschenpost_6829994?related_id=6829994&origin=search


function handleSendReply() {
  sendReply2(chatMessagesRef).then(() => {
    loadNearbyBottles()
    loadChatList()
  })
}


const bottleIcon = L.icon({
  iconUrl: bottleIconUrl,
  iconSize: [32, 32],         // 32x32 Pixel
  iconAnchor: [16, 32],       // center part down
  popupAnchor: [0, -32]       // Popup position
})

const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:8000'


const isAutoDetected = ref(false)
const showMyBottleModal = ref(false)
const chatMessagesRef = ref(null)

// to delete old bottles on map
const allBottleMarkers = []
const userLat = ref(null)
const userLon = ref(null)

const isMobile = ref(false)
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
  openBottle,
  maxReaders,
  visibilityKm,
  ttlMinutes
} from './throwBottleLogic.js'

import {
  myBottles,
  detailVisible,
  selectedBottle,
  closeDetailModal,
  fetchMyBottles
} from './myBottlesLogic.js'

onMounted(() => {

  fetchMyBottles()
})


import {
  selectedBottle as selectedAllBottle,
  allDetailVisible,
  closeDetailModal as closeAllDetailModal,
  allBottles,
} from './allBottlesLogic.js'

onMounted(() => {
  loadChatList();

  window.addEventListener('refresh-bottles', loadNearbyBottles);
});

onUnmounted(() => {
  window.removeEventListener('refresh-bottles', loadNearbyBottles);
});

import {
  showReplyInput,
  replyContent,
  toggleReplyBox,
  cancelReply,
  sendReply2,
  sendReply,
  showReplySuccessModal,
  getUserId
} from './replyLogic.js'


import {
  useChatLogic
} from './chatLogic.js'


const {
  showChatModal,
  showChatDetailModal,
  chatList,
  messageList,
  loadChatList,
  openConversation,
  formatDate,
} = useChatLogic(chatMessagesRef)

onMounted(() => {
  loadChatList()
})


onMounted(async () => {
  await nextTick()

  const mapContainer = document.getElementById('map')
  if (!mapContainer) {
    console.error('❌ Map container not found!')
    return
  }




  // Initialize Leaflet map
  if (!mapInstance) {
    mapInstance = L.map(mapContainer, {
      minZoom: 2,
      maxZoom: 24,     // OSM geht i. d. R. bis 19
      zoomSnap: 0.5,   // ← halbe Zoomstufen erlauben (oder 0.25 für noch feiner)
      zoomDelta: 1.0   // ← +/- Buttons springen in 0.5er-Schritten
    }).setView([48.1351, 11.5820], 13.5)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 24,
      detectRetina: true
    }).addTo(mapInstance)

    map.value = mapInstance
  } else {
    console.warn('⚠️ Map is already initialized')
  }

  // Ensure tiles render after layout
  setTimeout(() => {
    mapInstance.invalidateSize()
  }, 300)


  // -------------------------------------
  // Load coords from localStorage
  // -------------------------------------
  const savedLat = localStorage.getItem('userLat')
  const savedLon = localStorage.getItem('userLon')

  if (savedLat && savedLon) {
    const lat = parseFloat(savedLat)
    const lon = parseFloat(savedLon)

    const marker = L.marker([lat, lon])
      .addTo(mapInstance)
      .bindPopup('📍 Your Location')
      .openPopup()

    mapInstance.setView([lat, lon], 13)
  }

  // -------------------------------------
  // Load bottle from ?lat=...&lon=...&msg=...
  // -------------------------------------
  const query = new URLSearchParams(window.location.search)
  const queryLat = query.get('lat')
  const queryLon = query.get('lon')
  const msg = query.get('msg')

  if (queryLat && queryLon && msg) {
    const marker = L.marker([parseFloat(queryLat), parseFloat(queryLon)])
      .addTo(mapInstance)
      .bindPopup(`<strong>📦 New Bottle:</strong><br/>${msg}`)
      .openPopup()

    mapInstance.setView([parseFloat(queryLat), parseFloat(queryLon)], 14)
    window.history.replaceState({}, document.title, '/')
  }

  // -------------------------------------
  // Geolocation & Turf Mask
  // -------------------------------------
  navigator.geolocation.getCurrentPosition(
    async pos => {
      userLat.value = pos.coords.latitude
      userLon.value = pos.coords.longitude
      localStorage.setItem('userLat', userLat.value)
      localStorage.setItem('userLon', userLon.value)
      isAutoDetected.value = true

      const lat = parseFloat(localStorage.getItem('userLat'))
      const lon = parseFloat(localStorage.getItem('userLon'))

      // 📍 Your location marker again (second copy but intentional)
      L.marker([userLat.value, userLon.value])
        .addTo(mapInstance)
        .bindPopup('📍 Your Location')
        .openPopup()

      const R_EARTH = 6371000
      function destination(lat, lon, distanceM, bearingDeg) {
        const δ = distanceM / R_EARTH, θ = bearingDeg * Math.PI / 180
        const φ1 = lat * Math.PI / 180, λ1 = lon * Math.PI / 180
        const sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1)
        const sinδ = Math.sin(δ), cosδ = Math.cos(δ)
        const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ)
        const φ2 = Math.asin(sinφ2)
        const y = Math.sin(θ) * sinδ * cosφ1, x = cosδ - sinφ1 * sinφ2
        const λ2 = λ1 + Math.atan2(y, x)
        return [φ2 * 180 / Math.PI, ((λ2 * 180 / Math.PI + 540) % 360) - 180]
      }


      // Inner circle (5km)
      const whiteCircle = L.circle([lat, lon], {
        radius: 5000,
        color: 'black',
        fillColor: 'transparent',
        fillOpacity: 1,
        weight: 2
      }).addTo(mapInstance)

      const center = whiteCircle.getLatLng()
      const radiusM = whiteCircle.getRadius()
      const radiusKm = Math.round(radiusM / 1000)

      // 5km Label
      const [lblLat, lblLon] = destination(center.lat, center.lng, radiusM * 1.02, 0)

      L.marker([lblLat, lblLon], {
        icon: L.divIcon({
          className: 'radius-label',
          html: `<div class="radius-chip">${radiusKm} km</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        }),
        interactive: false
      }).addTo(mapInstance)

      //center view after login / change
      setTimeout(() => {
        mapInstance.invalidateSize();
        mapInstance.fitBounds(whiteCircle.getBounds(), {
          padding: [40, 40]
        })
        const targetZoom = 13.5
        mapInstance.setView(whiteCircle.getLatLng(), targetZoom)
      });

      // World polygon
      const world = turf.polygon([
        [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]
      ])

      // Hole around user location
      const hole = turf.circle([lon, lat], 5, {
        steps: 64,
        units: 'kilometers'
      })

      // Handle MultiPolygon case
      let holePoly = hole
      if (hole.geometry.type === 'MultiPolygon') {
        const firstPoly = hole.geometry.coordinates[0]
        holePoly = turf.polygon(firstPoly, hole.properties)
      }

      // Apply mask
      const masked = turf.mask(world, holePoly)
      L.geoJSON(masked, {
        style: {
          color: '#888',
          weight: 0,
          fillColor: '#ddd',
          fillOpacity: 0.5
        }
      }).addTo(mapInstance)

      // Nearby bottles only
      await loadNearbyBottles()
    },
    err => console.warn('Geolocation-Error', err),
    { enableHighAccuracy: true, timeout: 10000 }
  )
})


onMounted(() => {
  const update = () => {
    isMobile.value = window.innerWidth <= 768
  }

  update()
  window.addEventListener('resize', update)
})

watch(isMobile, async () => {
  await nextTick()

  // Delay to make sure DOM is updated
  setTimeout(() => {
    const el = document.getElementById('map')
    if (mapInstance && el?.offsetHeight > 0) {
      mapInstance.invalidateSize()
    } else {
      console.warn('❌ Map not visible or not initialized yet')
    }
  }, 300)
})


const map = ref(null)
let mapInstance = null

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})



function goToMap() {
  showSuccessModal.value = false

  const lat = localStorage.getItem('lastBottleLat')
  const lon = localStorage.getItem('lastBottleLon')

  if (lat && lon && mapInstance) {
    const coords = [parseFloat(lat), parseFloat(lon)]
    mapInstance.setView(coords, 16) 

    // Marker mit "New Bottle"
    L.marker(coords).addTo(mapInstance).bindPopup('📦 New Bottle').openPopup()
  }
}



//react on changes
watch(
  allBottles,
  bottles => {
    if (!mapInstance) return          
    /* delete old marker */
    allBottleMarkers.forEach(m => mapInstance.removeLayer(m))
    allBottleMarkers.length = 0

    /* draw new markers */
    bottles.forEach(b => {
      const loc = b.location || {}
      if (!('lat' in loc && 'lon' in loc)) return

      const tagsDisplay = (b.tags && b.tags.length > 0)
        ? `<small>Tags: ${b.tags.join(', ')}</small>`
        : `<small class="text-gray-400">No tags</small>`

      const marker = L.marker([loc.lat, loc.lon], { icon: bottleIcon }).addTo(mapInstance)
        .bindPopup(`
    <div style="max-width: 200px; font-size: 14px;">
      ${tagsDisplay}
      <br/>
      <button onclick="window.replyToBottle('${b.bottle_id}')" style="margin-top: 6px; padding: 4px 8px; font-size: 13px; border-radius: 4px; background: #eee; border: 1px solid #ccc;">💬 Reply</button>
    </div>
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

async function loadNearbyBottles() {
  if (userLat.value == null || userLon.value == null) return
  const res = await axios.get(
    `${API_BASE}/nearby_bottles`,
    { params: { lat: userLat.value, lon: userLon.value, radius: 10000 } }
  )
  allBottles.value = res.data.bottles
}



function goToMapReply() {
  showReplySuccessModal.value = false  
  // Aktuelles Bottle-Ort holen
  const bottle = selectedAllBottle.value
  const loc = bottle?.location
  if (loc && mapInstance) {
    const coords = [loc.lat, loc.lon]
    mapInstance.setView(coords, 16)
    L.marker(coords).addTo(mapInstance).bindPopup('📦 Reply sent here').openPopup()
  }

  allDetailVisible.value = false
}

</script>

<style scoped>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100dvh;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 100px;
  height: 100vh;
  width: 100vw;
}

#map {
  flex: 1;
  width: 100%;
  height: calc(100dvh - 60px);
  display: block;
  z-index: 0;
}

.map-container {
  height: 100vh !important;
  width: 100% !important;
  position: relative;
  z-index: 0;
}

.mobile-layout {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
}

.map-area {
  width: 100%;
  height: 100%;
  z-index: 0;
}

.mobile-button {
  flex: 1;
  height: 100%;
  border: none;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.mobile-button-bar {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  background-color: white;
  height: 60px;
  width: 100%;
  z-index: 10;
}

.mobile-button .icon {
  width: 1.5rem;
  height: 1.5rem;
}

.mobile-button-bar button {
  flex: 1;
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  gap: 2px;
  border: none;
  background: white;
}

.mobile-button-bar svg {
  width: 1.5rem;
  height: 1.5rem;
}

.sidebar {
  background-color: #b8bcc2;
  color: rgb(255, 255, 255);
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

.form-box2 {
  background: rgb(253, 253, 253);
  padding: 0 1.5rem 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  max-height: 550px;
  overflow-y: auto;
  color: black
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

@media (max-width: 768px) {
  .grid-container {
    display: flex !important;
    flex-direction: column;
    height: 100dvh;
  }

  .map-container {
    height: 100%;
    flex: 1;
  }

  .sidebar {
    display: none !important;
  }
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
  max-height: 650px;
  display: flex;
  flex-direction: column;
}

.form-right-header {
  position: relative;
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
  background-color: #f4f4f4;
  text-align: left;
  font-weight: bold;
}

.form-right-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.form-right-reply {
  display: flex;
  height: 100px;
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
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  font-size: 1rem;
  box-sizing: border-box;
}

/*thrownsuccessmodal*/
.modal {
  background-color: white;
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

.chat-info {

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

.bottle-details {
  text-align: center;
}

.icon {
  text-align: center;
}

@media (max-width: 768px) {
  .only-mobile {
    display: inline;
  }

  .form-box {
    width: 100vw !important;
    height: 100vh !important;
    border-radius: 0;
    max-height: none;
    max-width: none;
    margin: 0;
    position: relative;
  }

  .form-header {
    height: auto;
    padding: 0.75rem;
    font-size: 1rem;
    justify-content: space-between;
  }

  .form-content {
    flex-direction: column !important;
    height: 100%;
  }

  .form-right.mobile-hidden {
    display: none !important;
  }

  .form-left {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .form-right {
    width: 100%;
    height: 100%;
    flex-direction: column;
    display: flex;
    background-color: #f8f8f8;
    z-index: 10;
    position: absolute;
    top: 0;
    left: 0;
  }


  .form-right-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .form-right-reply {
    height: auto;
    padding: 0.5rem;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .form-right-reply-blank,
  .form-right-reply-button {
    width: 100%;
  }

  .form-right-reply-button {
    display: flex;
    justify-content: flex-end;
  }

  .reply-input {
    min-height: 60px;
    resize: vertical;
  }

  .chat-button {
    padding: 0.75rem;
    font-size: 0.875rem;
  }

  .chat-info-wrapper,
  .chat-info-text {
    font-size: 0.75rem;
    flex-direction: column;
    align-items: flex-start;
  }

  .chat-preview {
    font-size: 0.75rem;
  }

  .mobile-back-btn {
    background: none;
    border: none;
    font-size: 1rem;
    padding: 0.5rem;
    margin-right: auto;
    color: #007bff;
    cursor: pointer;
  }

  .form-right-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5rem;
  }

}

@media (min-width: 769px) {
  .only-mobile {
    display: none !important;
  }
}

/* 5km Text */
:deep(.radius-label.leaflet-div-icon) {
  background: transparent !important;
  border: 0 !important;
  width: 0 !important;
  height: 0 !important;
  box-shadow: none !important;
}

:deep(.radius-chip) {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  color: #111827;
  font-size: 30px;
  white-space: nowrap;
  font-weight: 600;
  transform: translate(100px, -40px);
}

@media (max-width: 768px) {
  :deep(.radius-chip) {
    font-size: 20px;
    transform: translate(60px, -24px);
  }
}
</style>