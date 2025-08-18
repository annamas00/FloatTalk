import { ref } from 'vue'
import axios from 'axios' 

// All bottles data
export const myBottles = ref([])

// Modal state + currently selected bottle
export const detailVisible = ref(false)
export const selectedBottle = ref(null)

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// Fetch user bottles 
export async function fetchMyBottles() {
  try {
    const userId = localStorage.getItem('user_id')
    const res = await axios.get(`${API_BASE}/my_bottles`, {
      params: { user_id: userId}
    })
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
