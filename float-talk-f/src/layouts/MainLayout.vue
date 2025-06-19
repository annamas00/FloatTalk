<template>
  <div class="main-layout">    <!-- Main Page Content like Map -->
    <RouterView />

    <!-- Sidebar & Buttons -->
    <div class="absolute top-0 right-0 h-full w-[300px] bg-white shadow-lg p-6 flex flex-col justify-between">
      <!-- Top Buttons -->
      <div class="space-y-4">
        <router-link to="/throw" class="btn-action">
          <div class="btn-inner">
            <Send class="w-5 h-5" />
            <span>Throw a Bottle</span>
          </div>
        </router-link>

        <button @click="readBottle" class="btn-action">
          <div class="btn-inner">
            <BookOpen class="w-5 h-5" />
            <span>Read Past Bottles</span>
          </div>
        </button>
      </div>

      <!-- Profile Button -->
      <div class="flex justify-center pt-6">
        <router-link to="/login" class="profile-btn" title="Profile">
          <UserCircle class="w-7 h-7" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BookOpen, Send, UserCircle } from 'lucide-vue-next'
import { logEvent } from '@/logger.js'
import axios from 'axios'

async function readBottle() {
  logEvent('bottle_read', {})

  try {
    const response = await axios.get('http://127.0.0.1:8000/bottles')
    const bottles = response.data

    if (bottles.length === 0) {
      alert('😢 Keine aktiven Bottles gefunden.')
      return
    }

    const randomBottle = bottles[Math.floor(Math.random() * bottles.length)]
    alert(`📖 Bottle gelesen:\n\nTags: ${randomBottle.message.join(", ")}\nStandort: ${randomBottle.location.lat}, ${randomBottle.location.lon}`)
  } catch (error) {
    console.error('❌ Fehler beim Laden der Bottles:', error)
    alert('❌ Fehler beim Lesen der Bottle')
  }
}
</script>

<style scoped>
.btn-action {
  @apply w-full bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg text-white font-medium transition duration-200;
}

.btn-inner {
  @apply flex items-center justify-center gap-2;
}

.profile-btn {
  @apply bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors;
}
</style>
