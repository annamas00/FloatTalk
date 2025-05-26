<template>
  <div style="color: white; padding: 2rem;">
    <h1>Hello {{ nickname }}</h1>

    <input v-model="nicknameInput" placeholder="Choose a nickname" />
    <button @click="setNickname">Save Nickname</button>

    <br /><br />
    <button @click="throwBottle">Throw Emotional Bottle</button>
    <button @click="readBottle">Read Random Bottle</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getOrCreateUserId } from './auth.js';
import { logEvent } from './logger.js';

const nickname = ref('Anonymous');
const nicknameInput = ref('');
const userId = ref('');

onMounted(async () => {
  userId.value = await getOrCreateUserId(); 
  nickname.value = localStorage.getItem('nickname') || 'Anonymous';
});

function setNickname() {
  nickname.value = nicknameInput.value;
  localStorage.setItem('nickname', nicknameInput.value);
}

function throwBottle() {
  logEvent("bottle_thrown", { tags: ["lonely", "sad"] });
}

function readBottle() {
  logEvent("bottle_read", { bottleId: "abc123" });
}
</script>
