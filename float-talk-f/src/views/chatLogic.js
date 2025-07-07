// chatLogic.js
import { ref } from 'vue'
import axios from 'axios'

export const currentBottleSenderId = ref(null)



export function useChatLogic() {
  const showChatModal = ref(false)
  const showChatDetailModal = ref(false)

  const chatList = ref([])
  const selectedConversation = ref(null)
  const messageList = ref([])
  const currentBottleId = ref(null) 
  const userId = localStorage.getItem('user_id')

 

    const loadChatList = async () => {
  try {
    const res = await axios.get(`http://localhost:8000/conversations/user/${userId}`)
    chatList.value = res.data || []

    
    for (let convo of chatList.value) {
      convo.first_message = convo.first_message || {
        sender_id: null,
        content: '',
        timestamp: null
      }
    }

 console.log('userid:', userId)



  } catch (err) {
    console.error('❌ Failed to load chat list:', err)
  }
}



  const openConversation = async (conversationId) => {
    selectedConversation.value = conversationId

    try {
      const res = await axios.get(`http://localhost:8000/conversation/${conversationId}`)
      messageList.value = res.data.messages || []
      
    currentBottleId.value = res.data.bottle_id || null  // save bottle_id
    currentBottleSenderId.value = res.data.bottle?.sender_id || null 
     
    console.log('bottle:', currentBottleId.value)
   

      showChatDetailModal.value = true
showReplyInput.value = true 
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }


function isoToBerlin(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('de-DE', {
    day      : '2-digit',
    month    : '2-digit',
    year     : 'numeric',
    hour     : '2-digit',
    minute   : '2-digit',
    second   : '2-digit',
    hourCycle: 'h23',
    timeZone : 'Europe/Berlin'
  }).format(new Date(iso))
}


  
const formatDate = isoToBerlin


  return {
    showChatModal,
    showChatDetailModal,
    chatList,
    selectedConversation,
    messageList,
    loadChatList,
    openConversation,
    formatDate,
    userId,
    currentBottleId
  }
}
