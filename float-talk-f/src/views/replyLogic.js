// replyLogic.js
import { ref, nextTick, unref } from 'vue'
import axios from 'axios'
import { currentBottleSenderId, currentBottleId, messageList } from './chatLogic'
import { toRaw } from 'vue'
import { closeDetailModal as closeAllDetailModal } from './allBottlesLogic'
//import { showReplySuccessModal } from './throwBottleLogic'


// Reply state
export const showReplyInput = ref(false)
export const replyContent = ref('')
//merken, zu welchem Bottle wir replyen
//export const currentBottleId = ref(null)
export const messageHistory = ref([])
export const userId = localStorage.getItem('user_id')
export const showReplySuccessModal = ref(false)  



// Toggle reply input
export function toggleReplyBox(bottleId) {
  showReplyInput.value = true 
   replyContent.value = ''
  currentBottleId.value = bottleId
}


export function cancelReply({ keepBottle = false } = {}) {
  replyContent.value = ''
  showReplyInput.value = false
  if (!keepBottle) {
    currentBottleId.value = null
  }
}



//reply for bottle
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

    console.log('✅ Reply sent:', response.data)
 

    cancelReply()
     await nextTick()

    closeAllDetailModal()   
     await nextTick()

    showReplySuccessModal.value = true
    console.log('✅ Setting showReplySuccessModal to TRUE now!')  
    await nextTick() 
  } catch (err) {
    console.error('❌ Reply failed:', err)
    alert('Failed to send reply.')
  }
} 



export async function scrollToBottom(refElement, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    const el = refElement?.value
    if (el && el.scrollHeight > 0) {
      el.scrollTop = el.scrollHeight
      console.log(`✅ Scrolled to bottom after ${i + 1} attempt(s):`, el.scrollTop)
      return
    }

    console.warn(`⏳ Waiting... (${i + 1}/${maxRetries})`)
  }

  console.warn('❌ Failed to scroll to bottom')
}




//reply for chat 
export async function sendReply2(chatMessages) {
 console.log('🧪 currentBottleId in replyLogic:', currentBottleId)
console.log('🧪 currentBottleId.value in replyLogic:', currentBottleId.value)

  console.log('Sending reply:', replyContent.value)
  console.log('Sending reply to bottle:', currentBottleId)
  console.log('Reply content:', replyContent.value)
  if (!currentBottleId.value) {
    console.error('❌ currentBottleId is missing or null')
    alert('⚠️ Kein Bottle gewählt')
    return
  }
  const receiverId = currentBottleSenderId.value
  const content = replyContent.value?.trim()
 if (!content) {
    alert('⚠️ Nachricht ist leer')
    return
  }

  try {
    const response = await axios.post('http://localhost:8000/reply', {
      bottle_id: currentBottleId.value,
      sender_id: userId,     
      receiver_id: receiverId,  
      //content: replyContent.value,
      content,
      reply_to: null
    })

    console.log('✅ Reply sent:', response.data)
        if (response.data?.status === 'error') {
      alert('❌ Serverfehler: ' + response.data.message)
      return
    }else if(response.data?.status === 'texterror') {
      alert('❌ Text error: ' + response.data.message)
      return
    }
    //alert('Reply sent successfully!')

    messageList.value.push({
  sender_id: userId,
  sender_nickname: 'You',
  content: content,
  timestamp: new Date().toISOString()
})
await nextTick()
console.log('📦 chatMessagesRef received in sendReply2:', chatMessages)

//Manueller Sofort-Scroll (Fallback oder Ergänzung)
const el = chatMessages?.value
if (el) {
  el.scrollTop = el.scrollHeight
  console.log('✅ Manuell direkt gescrollt (auch ohne Overflow)')
} else {
  console.warn('⚠️ chatMessages DOM-Element fehlt')
}


await scrollToBottom(chatMessages)
cancelReply({ keepBottle: true })

  } catch (err) {
    console.error('❌ Reply failed:', err)
    alert('Failed to send reply.')
  }
} 
