import { ref } from 'vue'
import axios from 'axios'

export const showForm = ref(false)
export const bottleContent = ref('')
export const location = ref('')
export const tagList = ref([])
export const tagInput = ref('')

export function addTag() {
  const value = tagInput.value.trim()
  if (
    value &&
    !tagList.value.includes(value) &&
    tagList.value.length < 5 // max tags
  ) {
    tagList.value.push(value)
  }
  tagInput.value = ''
}

export function handleTagKeydown(e) {
  const key = e.key
  if (
    (key === 'Enter' || key === ' ' || key === 'Space' || key === ',' || key === 'Comma') &&
    !e.isComposing
  ) {
    e.preventDefault()
    console.log('addInputKey：', key)
    addTag()
  }
}

export function removeTag(index) {
  tagList.value.splice(index, 1)
}

export async function submitBottle() {
  console.log('content:', bottleContent.value)
  console.log('tags:', tagList.value)
  console.log('location:', location.value)

  if (!bottleContent.value || !location.value) {
    console.warn('no locations')
    return
  }

  try {
    const res = await axios.post("http://localhost:8000/add_bottle", {
      bottle_id: "btl_" + Date.now(),
      sender_id: "user_test01",
      content: bottleContent.value,
      tags: tagList.value,
      location: {
        lat: 52.52,
        lon: 13.405,
      },
      city: "Munich"
    })

    console.log('✅ Server response:', res.data)

    // refresh fo
    showForm.value = false
    bottleContent.value = ''
    location.value = ''
    tagList.value = []
    tagInput.value = ''

    return res.data
  } catch (err) {
    console.error('❌ Submit failed:', err)
  }
}
