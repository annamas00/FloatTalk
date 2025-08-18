import { ref, nextTick, watch } from 'vue'
import axios from 'axios'
import { scrollToBottom } from './replyLogic' 

export const currentBottleSenderId = ref(null)
export const currentBottleId = ref(null)
export const messageList = ref([])
export const chatList = ref([])
export const selectedConversation = ref(null)
export const userId = localStorage.getItem('user_id')

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// Load list of conversations for the user
export async function loadChatList() {
  try {
    const res = await axios.get(`${API_BASE}/conversations/user/${userId}`)
    chatList.value = res.data || []

    for (let convo of chatList.value) {
      convo.first_message = convo.first_message || {
        sender_id: null,
        content: '',
        timestamp: null
      }
    }
  } catch (err) {
    console.error('❌ Failed to load chat list:', err)
  }
}

//chat modal state
export function useChatLogic(chatMessagesRef) {
  const showChatModal = ref(false)
  const showChatDetailModal = ref(false)
  //loads a conversation 
  const openConversation = async (conversationId) => {
    selectedConversation.value = conversationId
    try {
      const res = await axios.get(`${API_BASE}/conversation/${conversationId}`)
      messageList.value = res.data.messages || []
      currentBottleId.value = res.data.bottle_id || null  // save bottle_id
      currentBottleSenderId.value = res.data.bottle?.sender_id || null 
      showChatDetailModal.value = true
    }catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }
  //autoscroll down when open chat detail
  watch(showChatDetailModal, async (visible) => {
    if (visible) {
      await nextTick()
      await new Promise(r => setTimeout(r, 150)) 

      if (chatMessagesRef.value instanceof HTMLElement) {
        await scrollToBottom(chatMessagesRef)
      } else {
        console.warn('⚠️ chatMessages is no HTMLElement:', chatMessagesRef.value)
      }
    }
  })
  //autscroll down when writing message in chat detail
  watch(messageList, async () => {
    await nextTick()
    setTimeout(async () => {
      if (chatMessagesRef.value && chatMessagesRef.value.scrollHeight > 0) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      } else {
        console.warn('❌ Autoscroll failed after new message')
      }
    }, 100)
  })

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

//Formats a UTC/ISO timestamp for display in Europe/Berlin, 24h clock.
 export function formatDate(iso) {
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