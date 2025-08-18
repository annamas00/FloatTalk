import { ref, nextTick } from 'vue'
import axios from 'axios'
import { currentBottleSenderId, currentBottleId, messageList, selectedConversation, chatList, loadChatList } from './chatLogic'
import { closeDetailModal as closeAllDetailModal, allBottles } from './allBottlesLogic'


// Reply state
export const showReplyInput = ref(false)
export const replyContent = ref('')
export const showReplySuccessModal = ref(false)

const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000'


export function getUserId() {
  return localStorage.getItem('user_id') || ''
}

//open reply box for a bottle
export function toggleReplyBox(bottleId) {
  showReplyInput.value = true
  replyContent.value = ''
  currentBottleId.value = bottleId
}

//cancel reply input
export function cancelReply({ keepBottle = false } = {}) {
  replyContent.value = ''
  showReplyInput.value = false
  if (!keepBottle) {
    currentBottleId.value = null
  }
}

//move a conversation to top and update its last message
function moveConversationToTop(conversationId, content) {
  const me = getUserId()
  const index = chatList.value.findIndex(c => c.conversation_id === conversationId)
  if (index !== -1) {
    const convo = chatList.value.splice(index, 1)[0]
    convo.last_message = {
      sender_id: me,
      content: content,
      timestamp: new Date().toISOString()
    }
    chatList.value.unshift(convo)

  }
}

//reply on bottle 
export async function sendReply(selectedAllBottle) {
  if (selectedAllBottle) {
  }
  const me = getUserId()
  if (!selectedAllBottle) {
    console.error('❌ Missing required selectedAllBottle fields')
    return
  }
  if (!selectedAllBottle.sender_id) {
    console.error('❌ Missing sender_id in selectedAllBottle')
    return
  }
  if (!replyContent.value) {
    console.error('❌ Missing required reply fields')
    return
  }
  const content = replyContent.value?.trim()
  if (!content) return

  try {
    const response = await axios.post(`${API_BASE}/reply`, {
      bottle_id: selectedAllBottle.bottle_id,
      sender_id: me,
      receiver_id: selectedAllBottle.sender_id,
      content,
      reply_to: null
    })
    const data = response.data || {};

    //handle errors 
    if (data?.status !== 'success') {
      const msg = data?.message || ''
      //time expired → delete and close directly
      if (/expired/i.test(msg)) {
        allBottles.value = allBottles.value.filter(b => b.bottle_id !== selectedAllBottle.bottle_id)
        closeAllDetailModal()
        window.dispatchEvent(new CustomEvent('refresh-bottles'))
        alert('⏰ This bottle has expired.')
        return
      }
      //limit reached
      if (/max(imum)? number of readers|Limit.*reached/i.test(msg)) {
        allBottles.value = allBottles.value.filter(b => b.bottle_id !== selectedAllBottle.bottle_id)
        closeAllDetailModal()
        window.dispatchEvent(new CustomEvent('refresh-bottles'))
        alert('🚫 Limit reached: no more replies allowed.')
        return
      }
      if (data?.status === 'texterror') {
        alert('❌ ' + msg)
        return
      }
      alert('❌ ' + (msg || 'Failed to send reply.'))
      return
    }

    //handle success: reset input, close modal, show confirmation modal
    cancelReply()
    await nextTick()
    closeAllDetailModal()
    await nextTick()
    showReplySuccessModal.value = true

    //refresh chat list
    await loadChatList()
    await nextTick()

    //search matching conversation 
    const matchingConversation = chatList.value.find(c => {
      const ids = (c.participants || []).map(p => p.user_id ?? p)
      return c.bottle_id === selectedAllBottle.bottle_id &&
        ids.includes(String(me)) &&
        ids.includes(String(selectedAllBottle.sender_id))
    })

    if (matchingConversation) {
      try { moveConversationToTop?.(matchingConversation.conversation_id, content); } catch { }
      selectedConversation.value = matchingConversation.conversation_id;
    }

    //if bottle full remove it from map
    if (data?.bottle_full) {
      allBottles.value = allBottles.value.filter(b => b.bottle_id !== selectedAllBottle.bottle_id)
      window.dispatchEvent(new CustomEvent('refresh-bottles'))
      return
    }

    // update readers count for not bottle owner user's
    const isOwner = String(me) === String(selectedAllBottle.sender_id)
    if (!isOwner) {
      const max = Number(selectedAllBottle?.max_readers ?? 0)
      const prevCount = Number(
        selectedAllBottle?.readers_count ??
        (selectedAllBottle?.reader_ids?.length ?? 0)
      )
      const meStr = String(me)
      const list = Array.isArray(selectedAllBottle.reader_ids) ? selectedAllBottle.reader_ids.map(String) : []
      const already = list.includes(meStr)
      const nextCount = already ? prevCount : prevCount + 1

      if (Number.isFinite(max) && max > 0 && nextCount >= max) {
        allBottles.value = allBottles.value.filter(
          b => b.bottle_id !== selectedAllBottle.bottle_id);
        window.dispatchEvent(new CustomEvent('refresh-bottles'));
        return;
      } else
        if (!already) {
          selectedAllBottle.readers_count = nextCount
          selectedAllBottle.reader_ids = [...list, meStr]
        }
    }
  }
  catch (err) {
    //handle network or API errors
    const apiMsg = err?.response?.data?.message || ''
    if (/expired/i.test(apiMsg) || /max(imum)? number of readers|Limit.*reached/i.test(apiMsg)) {
      allBottles.value = allBottles.value.filter(b => b.bottle_id !== selectedAllBottle.bottle_id)
      closeAllDetailModal()
      window.dispatchEvent(new CustomEvent('refresh-bottles'))
      alert(apiMsg || 'Reply not possible.')
      return
    }
    console.error('❌ Reply failed:', err)
    alert(apiMsg || 'Failed to send reply.')
  }
}

//automatically scroll down in a chat
export async function scrollToBottom(refElement, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))
    const el = refElement?.value
    if (el && el.scrollHeight > 0) {
      el.scrollTop = el.scrollHeight
      return
    }
    console.warn(`⏳ Waiting... (${i + 1}/${maxRetries})`)
  }
  console.warn('❌ Failed to scroll to bottom')
}

//reply in a chat 
export async function sendReply2(chatMessages) {
  const me = getUserId()
  if (!currentBottleId.value) {
    console.error('❌ currentBottleId is missing or null')
    alert('⚠️ No bottle chosen')
    return
  }
  const receiverId = currentBottleSenderId.value
  const content = replyContent.value?.trim()
  if (!content) {
    alert('⚠️ Message is empty')
    return
  }

  try {
    const response = await axios.post(`${API_BASE}/reply`, {
      bottle_id: currentBottleId.value,
      sender_id: me,
      receiver_id: receiverId,
      content,
      reply_to: null
    })

    const data = response.data || {}
    const status = String(data.status || '').toLowerCase()
    const msg = data.message || ''

    if (status !== 'success') {
      if (/expired/i.test(msg)) { alert('⏰ Bottle expired.'); return }
      if (/max(imum)? number of readers|limit.*reached/i.test(msg)) { alert('🚫 Limit reached.'); return }
      if (status === 'texterror') { alert('❌ ' + msg); return }
      alert('❌ ' + (msg || 'Failed to send reply.'))
      return
    }

    //push new message into chat
    messageList.value.push({
      sender_id: me,
      sender_nickname: data.sender_nickname || localStorage.getItem('nickname') || localStorage.getItem('username') || me,
      content,
      timestamp: new Date().toISOString()
    })
    await nextTick()
    await scrollToBottom(chatMessages)
    cancelReply({ keepBottle: true })
    moveConversationToTop(selectedConversation.value, content)
    //if bottle full reload map
    if (data?.bottle_full) {
      window.dispatchEvent(new CustomEvent('refresh-bottles'))
    }
  } catch (err) {
    console.error('❌ Reply failed:', err)
    alert('Failed to send reply.')
  }
} 
