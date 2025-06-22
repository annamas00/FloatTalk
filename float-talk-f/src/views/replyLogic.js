// replyLogic.js
import { ref } from 'vue'
import axios from 'axios'

// Reply state
export const showReplyInput = ref(false)
export const replyContent = ref('')

export const messageHistory = ref([])



// Toggle reply input
export function toggleReplyBox() {
  showReplyInput.value = true
}

export function cancelReply() {
  replyContent.value = ''
  showReplyInput.value = false
}


//need change
export async function sendReply(selectedAllBottle) {
  console.log('Sending reply:', replyContent.value)

  if (!selectedAllBottle ) {
    console.error('❌ Missing required selectedAllBottle fields')
    return
  }

  if (!replyContent.value ) {
    console.error('❌ Missing required reply fields')
    return
  }
  try {
// need change
    const response = await axios.post('http://localhost:8000/reply', {
      bottle_id: selectedAllBottle.bottle_id,
      sender_id: 'user_test02',     
      receiver_id: 'user_test01',  
      content: replyContent.value,
      reply_to: null
    })

    console.log('✅ Reply sent:', response.data)
    alert('Reply sent successfully!')
    cancelReply()

  } catch (err) {
    console.error('❌ Reply failed:', err)
    alert('Failed to send reply.')
  }
} 

//need change
export async function sendReply2(currentBottleId) {

//const currentBottleId = bottleRef?.value
  console.log('Sending reply:', replyContent.value)
console.log('Sending reply to bottle:', currentBottleId)
console.log('Reply content:', replyContent.value)

  if (!currentBottleId || currentBottleId === 'null') {
  console.error('❌ Missing required currentBottleId fields')
  return
}

  try {
// need change
    const response = await axios.post('http://localhost:8000/reply', {
      bottle_id: currentBottleId,
      sender_id: 'user_test02',     
      receiver_id: 'user_test01',  
      content: replyContent.value,
      reply_to: null
    })

    console.log('✅ Reply sent:', response.data)
    alert('Reply sent successfully!')
    cancelReply()

  } catch (err) {
    console.error('❌ Reply failed:', err)
    alert('Failed to send reply.')
  }
} 

/* export async function loadMessageHistory(bottleId) {
  try {
    const res = await axios.get(`http://localhost:8000/conversation/${bottleId}/messages`)
    messageHistory.value = res.data.messages
    console.log("💬 Message history loaded:", messageHistory.value)
  } catch (err) {
    console.error("❌ Failed to load message history:", err)
  }
} */
