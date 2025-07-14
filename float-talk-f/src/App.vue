<template>
  <RouterView />
</template>



<script setup>
import { ref, watchEffect, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { getOrCreateUserId } from './auth.js';
import { logEvent } from './logger.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { dummyBottles } from './data/dummyBottles.js';
import markerIcon2x from './assets/leaflet/marker-icon-2x.png';
import markerIcon from './assets/leaflet/marker-icon.png';
import markerShadow from './assets/leaflet/marker-shadow.png';
import { Send, BookOpen, UserCircle } from 'lucide-vue-next';

const nickname = ref('Anonymous');
const nicknameInput = ref('');
const userId = ref('');
const route = useRoute();

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
.main-layout .grid-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  height: 100vh;
  width: 100vw;
}

.main-layout .map-container {
  height: 100%;
  width: 100%;
}

.main-layout .sidebar {
  @apply bg-gray-900 text-white px-6 py-8 flex flex-col h-full;
}

.main-layout .btn-action {
  @apply w-56 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg text-white font-medium transition duration-200;
}

.main-layout .btn-inner {
  @apply flex items-center justify-center gap-2;
}

.main-layout .profile-btn {
  @apply bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors;
}

.main-layout .btn-action:hover,
.main-layout .profile-btn:hover {
  @apply ring-2 ring-indigo-400 ring-offset-2;
}

</style>


