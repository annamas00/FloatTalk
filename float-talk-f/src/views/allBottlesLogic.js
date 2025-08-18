import { ref } from 'vue'

export const allBottles = ref([])

// Modal display state
export const allDetailVisible = ref(false)
export const selectedBottle = ref(null)  

// Close modal
export function closeDetailModal() {
  allDetailVisible.value = false
}
