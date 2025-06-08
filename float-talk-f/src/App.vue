<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>

  <div class="flex-1 flex flex-col items-center justify-center space-y-4">
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

  <div class="flex justify-center pb-4">
  <router-link to="/login" class="profile-btn" title="Profile">
    <UserCircle class="w-7 h-7" />
  </router-link>
</div>
</template>


<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { getOrCreateUserId } from './auth.js';
import { logEvent } from './logger.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { dummyBottles } from './data/dummyBottles.js';
import markerIcon2x from './assets/leaflet/marker-icon-2x.png';
import markerIcon from './assets/leaflet/marker-icon.png';
import markerShadow from './assets/leaflet/marker-shadow.png';
import { Send, BookOpen, UserCircle } from 'lucide-vue-next';
import axios from 'axios'



delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
const nickname = ref('Anonymous');
const nicknameInput = ref('');
const userId = ref('');

onMounted(async () => {
  userId.value = await getOrCreateUserId();
  nickname.value = localStorage.getItem('nickname') || 'Anonymous';

  // Wait until DOM is laid out
  await nextTick();

  const map = L.map('map').setView([48.1351, 11.5820], 12); // Munich
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  dummyBottles.forEach(bottle => {
    const marker = L.marker(bottle.coords).addTo(map);
    marker.bindTooltip(bottle.title, {
      permanent: false,
      direction: 'top',
      className: 'text-sm'
    });
    marker.bindPopup(`
    <strong>${bottle.title}</strong><br/>
    <p style="margin-top: 0.5em;">${bottle.message}</p>
    <small>📍 Zip Code: ${bottle.zip}</small>
  `);
  });
});

async function throwBottle() {
  console.log("🌍 Versuche Standort zu ermitteln...");

  logEvent("bottle_thrown", { tags: ["lonely", "sad"] });


  try {
    // Hole den Standort per Browser-API
    navigator.geolocation.getCurrentPosition(async (position) => {
      const location = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      const now = new Date();
      const durationEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

      const res = await axios.post('http://127.0.0.1:8000/log', {
        user_id: userId.value,
        action: 'bottle_thrown',
        details: {
          tags: ['lonely', 'sad'],
          time: now.toISOString(),
          duration_until: durationEnd.toISOString(),
          location: location
        }
      });

      console.log("✅ Erfolgreich geloggt:", res.data);
      alert("📦 Bottle geworfen!");
    }, (error) => {
      console.error("❌ Standort konnte nicht ermittelt werden:", error);
      alert("❌ Bitte Standortfreigabe aktivieren, um eine Bottle zu werfen.");
    });

  } catch (error) {
    console.error("❌ Fehler beim Senden an die API:", error);
    alert("❌ Fehler beim Werfen der Bottle");
  }
}


async function readBottle() {
  logEvent("bottle_read", {});

  try {
    const response = await axios.get('http://127.0.0.1:8000/bottles');
    const bottles = response.data;

    if (bottles.length === 0) {
      alert("😢 Keine aktiven Bottles gefunden.");
      return;
    }

    const randomBottle = bottles[Math.floor(Math.random() * bottles.length)];
    alert(`📖 Bottle gelesen:\n\nTags: ${randomBottle.message.join(", ")}\nStandort: ${randomBottle.location.lat}, ${randomBottle.location.lon}`);
  } catch (error) {
    console.error("❌ Fehler beim Laden der Bottles:", error);
    alert("❌ Fehler beim Lesen der Bottle");
  }
}


</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}


/* Grid layout with 2 columns: map + sidebar */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  height: 100vh;
  width: 100vw;
}

/* Map must be full height */
.map-container {
  height: 100%;
  width: 100%;
}

/* Sidebar */
.sidebar {
  @apply bg-gray-900 text-white px-6 py-8 flex flex-col h-full; 
}

/* Buttons */
.btn-action {
  @apply w-56 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg text-white font-medium transition duration-200;
}

.btn-inner {
  @apply flex items-center justify-center gap-2;
}

.profile-btn {
  @apply bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors;
}

.btn-action:hover,
.profile-btn:hover {
  @apply ring-2 ring-indigo-400 ring-offset-2;
}

</style>


