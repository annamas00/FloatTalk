import { ref } from 'vue'
import axios from 'axios'


export const showForm = ref(false)
export const bottleContent = ref('')
export const location = ref('')
export const tagList = ref([])
export const tagInput = ref('')

export function addTag() {
  const value = tagInput.value.trim()
  if (value && !tagList.value.includes(value)) {
    tagList.value.push(value)
  }
  tagInput.value = ''
}

export function handleTagKeydown(e) {
  const key = e.key
  if ((key === 'Enter' || key === ' ' || key === ',' || key === 'Space') && !e.isComposing) {
    e.preventDefault()
    console.log('addInpuKey：', key)
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

    // 清空表单
    showForm.value = false
    bottleContent.value = ''
    location.value = ''
    tagList.value = []
    tagInput.value = ''
  } catch (err) {
    console.error('❌ Submit failed:', err)
  }
}
