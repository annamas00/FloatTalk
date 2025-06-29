// replyLogic.js
import { ref } from 'vue'
import axios from 'axios'
import { currentBottleSenderId } from './chatLogic'
import { toRaw } from 'vue'

// Reply state
export const showReplyInput = ref(false)
export const replyContent = ref('')

export const messageHistory = ref([])

export const userId = localStorage.getItem('user_id')


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
console.log('selectedAllBottle:', selectedAllBottle)
console.log('selectedAllBottle keys:', Object.keys(toRaw(selectedAllBottle)))


  if (!selectedAllBottle ) {
    console.error('❌ Missing required selectedAllBottle fields')
    return
    
  }
    if (!selectedAllBottle.sender_id) {
    console.error('❌ Missing sender_id in selectedAllBottle')
    return
  }


  if (!replyContent.value ) {
    console.error('❌ Missing required reply fields')
    return
  }


  try {

    const response = await axios.post('http://localhost:8000/reply', {

      bottle_id: selectedAllBottle.bottle_id,
      sender_id: userId,     
      receiver_id:selectedAllBottle.sender_id,  
      content: replyContent.value,
      reply_to: null
    })

    console.log('Payload being sent:', {
  bottle_id: selectedAllBottle.bottle_id,
  sender_id: userId,
  receiver_id: selectedAllBottle.sender_id,
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

  const receiverId = currentBottleSenderId.value

  try {
// need change
    const response = await axios.post('http://localhost:8000/reply', {
      bottle_id: currentBottleId,
      sender_id: userId,     
      receiver_id: receiverId,  
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
