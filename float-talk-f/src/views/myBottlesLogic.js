// myBottlesLogic.js
import { ref } from 'vue'
import axios from 'axios'  

// Dropdown visibility state
export const dropdownOpen = ref(false)
export function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

// All bottles data
export const myBottles = ref([])

// Modal state + currently selected bottle
export const detailVisible = ref(false)
export const selectedBottle = ref(null)

// Fetch all bottles (no user restriction)
export async function fetchMyBottles() {
  try {
    const res = await axios.get('http://localhost:8000/my_bottles', {
      params: { user_id: 'user_test01' }
    })
    console.log('📥 Bottles loaded:', res.data.bottles)
    myBottles.value = res.data.bottles
  } catch (err) {
    console.error('❌ Failed to fetch bottles:', err)
  }
}

//  Show details for a single bottle
export function viewBottleDetail(bottle) {
  console.log('🧾 Selected bottle:', bottle)
  selectedBottle.value = bottle
  detailVisible.value = true
}

// Close the detail modal
export function closeDetailModal() {
  detailVisible.value = false
}
