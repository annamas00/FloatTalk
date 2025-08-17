<template>
  <div :class="isHomeLayout ? 'main-layout' : ''">
    <router-view />
  </div>
</template>


<script setup>
import {computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const isHomeLayout = computed(() => route.path === '/home')
</script>
