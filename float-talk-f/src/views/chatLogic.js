// chatLogic.js
import { ref, nextTick, watch } from 'vue'
import axios from 'axios'
import { scrollToBottom } from './replyLogic' 

export const currentBottleSenderId = ref(null)
export const currentBottleId = ref(null)
//export const messageList = ref(null)
export const messageList = ref([])
export const chatList = ref([])
export const selectedConversation = ref(null)
export const userId = localStorage.getItem('user_id')


export async function loadChatList() {
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

    console.log('✅ chatList loaded')
  } catch (err) {
    console.error('❌ Failed to load chat list:', err)
  }
}


export function useChatLogic(chatMessagesRef) {
  const showChatModal = ref(false)
  const showChatDetailModal = ref(false)

  //const chatList = ref([])
  //const selectedConversation = ref(null)
  //const messageList = ref([])
  //const currentBottleId = ref(null) 

  const openConversation = async (conversationId) => {
    selectedConversation.value = conversationId

    try {
      const res = await axios.get(`http://localhost:8000/conversation/${conversationId}`)
      messageList.value = res.data.messages || []
      
    currentBottleId.value = res.data.bottle_id || null  // save bottle_id
    currentBottleSenderId.value = res.data.bottle?.sender_id || null 
     
    console.log('conversation loaded, bottle:', currentBottleId.value)


      showChatDetailModal.value = true
//showReplyInput.value = true 
}catch (err) {
    console.error('Failed to load conversation:', err)
  }
}
    
     watch(showChatDetailModal, async (visible) => {
    if (visible) {
      await nextTick()
      await new Promise(r => setTimeout(r, 150)) // sicherstellen, dass DOM da ist

      if (chatMessagesRef.value instanceof HTMLElement) {
        console.log('🧪 autoscroll nach Öffnen:', chatMessagesRef.value)
        await scrollToBottom(chatMessagesRef)
      } else {
        console.warn('⚠️ chatMessages ist kein HTMLElement:', chatMessagesRef.value)
      }
    }
  })

    watch(messageList, async () => {
    await nextTick()
    setTimeout(async () => {
      if (chatMessagesRef.value && chatMessagesRef.value.scrollHeight > 0) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
        console.log('✅ Auto-Scroll nach neuer Nachricht')
      } else {
        console.warn('❌ Auto-Scroll nach Nachricht fehlgeschlagen')
      }
    }, 100)
  })

//function isoToBerlin(iso) {
   const formatDate = (iso) => {
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

//const formatDate = isoToBerlin

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
