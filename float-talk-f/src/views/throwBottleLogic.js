import { ref } from 'vue'

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

export function submitBottle() {
  console.log('内容:', bottleContent.value)
  console.log('标签:', tagList.value)
  console.log('位置:', location.value)

  showForm.value = false
  bottleContent.value = ''
  location.value = ''
  tagList.value = []
  tagInput.value = ''
}
