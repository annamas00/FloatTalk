// chatLogic.js
import { ref } from 'vue'
import axios from 'axios'

export function useChatLogic(userId) {
  const showChatModal = ref(false)
  const showChatDetailModal = ref(false)

  const chatList = ref([])
  const selectedConversation = ref(null)
  const messageList = ref([])
  const currentBottleId = ref(null) 

  const loadChatList = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/conversations/user/${userId}`)
      chatList.value = res.data || []

      // fetch first messages for preview
      for (let convo of chatList.value) {
        const res = await axios.get(`http://localhost:8000/conversation/${convo.conversation_id}`)
        //convo.first_message = msgRes.data.messages?.[0] || null
        convo.first_message = {
  sender_id: res.data.bottle?.sender_id,
  content: res.data.bottle?.content,
  timestamp: res.data.bottle?.timestamp
}
      }

    } catch (err) {
      console.error('Failed to load chat list:', err)
    }
  }

  const openConversation = async (conversationId) => {
    selectedConversation.value = conversationId

    try {
      const res = await axios.get(`http://localhost:8000/conversation/${conversationId}`)
     
   
     
      messageList.value = res.data.messages || []
    //currentBottleId.value = res.data.bottle_id || null  // save bottle_id

      showChatDetailModal.value = true
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }

  const formatDate = (str) => {
    if (!str) return ''
    return new Date(str).toLocaleString()
  }

  return {
    showChatModal,
    showChatDetailModal,
    chatList,
    selectedConversation,
    messageList,
    loadChatList,
    openConversation,
    formatDate
  }
}
