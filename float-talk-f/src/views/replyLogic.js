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



export async function sendReply(selectedAllBottle, senderId = 'user_test01') {
  console.log('Sending reply:', replyContent.value)

  if (!selectedAllBottle || !replyContent.value || !senderId) {
    console.error('❌ Missing required fields')
    return
  }


  
  try {

    const response = await axios.post('http://localhost:8000/reply', {
      bottle_id: selectedAllBottle.bottle_id,
     sender_id: 'user_test01',     
  receiver_id: 'user_test02',  
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

export async function loadMessageHistory(bottleId) {
  try {
    const res = await axios.get(`http://localhost:8000/conversation/${bottleId}/messages`)
    messageHistory.value = res.data.messages
    console.log("💬 Message history loaded:", messageHistory.value)
  } catch (err) {
    console.error("❌ Failed to load message history:", err)
  }
}
