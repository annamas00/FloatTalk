// allBottlesLogic.js
import { ref } from 'vue'
import axios from 'axios'

// State for dropdown
export const allDropdownOpen = ref(false)
export function toggleAllDropdown() {
  allDropdownOpen.value = !allDropdownOpen.value
}

// All bottles
export const allBottles = ref([])

// Modal display state
export const allDetailVisible = ref(false)
export const selectedBottle = ref(null)  

// Fetch all bottles from server
export async function fetchAllBottles() {
  try {
    //const { data } = await axios.get(`${API_BASE}/all_bottles`)
     const res = await axios.get('http://localhost:8000/all_bottles')
    console.log('🌊 All bottles loaded:', res.data.bottles)
    allBottles.value = res.data.bottles            // <- reaktiver State
    return allBottles.value                    // <- Rückgabe!
  } catch (err) {
    console.error('❌ Failed to fetch all bottles:', err)
  }
}

// Open modal to show one bottle
export async function showBottle(bottle) {
  selectedBottle.value = bottle
  allDetailVisible.value = true
  //await loadMessageHistory(bottle.bottle_id)  
}

// Close modal
export function closeDetailModal() {
  allDetailVisible.value = false
}
