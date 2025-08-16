// replyLogic.js
import { ref, nextTick, unref } from 'vue'
import axios from 'axios'
import { currentBottleSenderId, currentBottleId, messageList, selectedConversation, chatList, loadChatList } from './chatLogic'
import { toRaw } from 'vue'
import { closeDetailModal as closeAllDetailModal, allBottles } from './allBottlesLogic'
//import { showReplySuccessModal } from './throwBottleLogic'


// Reply state
export const showReplyInput = ref(false)
export const replyContent = ref('')
//merken, zu welchem Bottle wir replyen
//export const currentBottleId = ref(null)
export const messageHistory = ref([])
//export const userId = localStorage.getItem('user_id')
export const showReplySuccessModal = ref(false)  
export function getUserId() {
  return localStorage.getItem('user_id') || ''
}


const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000'


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


function moveConversationToTop(conversationId, content) {
  const me = getUserId()
    console.log('🧪 selectedConversation:', conversationId)
console.log('📋 chatList:', chatList.value.map(c => c.conversation_id))
  const index = chatList.value.findIndex(c => c.conversation_id === conversationId)
  if (index !== -1) {
    const convo = chatList.value.splice(index, 1)[0]

    // Letzte Nachricht aktualisieren
    convo.last_message = {
      sender_id: me,
      content: content,
      timestamp: new Date().toISOString()
    }

    console.log('🔝 Conversation moved to top:', convo)
    chatList.value.unshift(convo)

  }
}

// Hilfsfunktion: Bottle neu laden (damit readers_count/reader_ids live sind)
async function refreshBottle(bottle) {
  try {
    const { data } = await axios.get(`${API_BASE}/bottles/${bottle.bottle_id}`)
    // akzeptiere { bottle: {...} } oder direkt {...}
    const fresh = data?.bottle ?? data
    if (fresh && typeof fresh === 'object') {
      Object.assign(bottle, fresh)
    }
  } catch (e) {
    console.warn('Bottle refresh failed', e)
  }
}

//reply for bottle
export async function sendReply(selectedAllBottle) {
  console.log('Sending reply:', replyContent.value)
  console.log('selectedAllBottle:', selectedAllBottle)
  if (selectedAllBottle) {
  console.log('selectedAllBottle keys:', Object.keys(toRaw(selectedAllBottle)))
 }
  const me = getUserId()
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

  const content = replyContent.value?.trim()
  if (!content) return

  try {
    const response = await axios.post(`${API_BASE}/reply`, {

      bottle_id: selectedAllBottle.bottle_id,
      sender_id: me,     
      receiver_id:selectedAllBottle.sender_id,  
      content,
      reply_to: null
    })
    const data = response.data || {};


    console.log('✅ Reply sent:', data)

    if (data?.status !== 'success') {
      const msg = data?.message || ''
      // TTL abgelaufen → sofort entfernen + schließen
      if (/expired/i.test(msg)) {
        allBottles.value = allBottles.value.filter(b => b.bottle_id !== selectedAllBottle.bottle_id)
        closeAllDetailModal()
        window.dispatchEvent(new CustomEvent('refresh-bottles'))
        alert('⏰ This bottle has expired.')
        return
      }
      // Limit erreicht
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


    cancelReply()
    await nextTick()
    closeAllDetailModal()   
    await nextTick()
    showReplySuccessModal.value = true
    console.log('✅ Setting showReplySuccessModal to TRUE now!')  
    await loadChatList()
    await nextTick() 
    // 🔍 Suche passende Konversation (falls vorhanden)
    const matchingConversation = chatList.value.find(c =>{
       const ids = (c.participants || []).map(p => p.user_id ?? p)
      return c.bottle_id === selectedAllBottle.bottle_id &&
             ids.includes(String(me)) &&
             ids.includes(String(selectedAllBottle.sender_id))
    })
      //c.bottle_id === selectedAllBottle.bottle_id &&
      //c.participants.includes(userId) &&
      //c.participants.includes(selectedAllBottle.sender_id))

    if (matchingConversation) {
      try {moveConversationToTop?.(matchingConversation.conversation_id, content);} catch{}
      selectedConversation.value = matchingConversation.conversation_id;
      // showChatModal.value = true
      // showChatDetailModal.value = true
    }  
// Sofortiges Entfernen bei voller Bottle (vom Backend signalisiert)
    if (data?.bottle_full) {
      allBottles.value = allBottles.value.filter(b => b.bottle_id !== selectedAllBottle.bottle_id)
      window.dispatchEvent(new CustomEvent('refresh-bottles'))
      return
    }

    // 🔁 Vorsichtige lokale Aktualisierung (nur wenn ich NICHT Owner bin)
    const isOwner = String(me) === String(selectedAllBottle.sender_id)
    if (!isOwner) {
      const max = Number(selectedAllBottle?.max_readers ?? 0)
      const prevCount = Number(
        selectedAllBottle?.readers_count ??
        (selectedAllBottle?.reader_ids?.length ?? 0)
      )
      const meStr = String(me)
      const list  = Array.isArray(selectedAllBottle.reader_ids)? selectedAllBottle.reader_ids.map(String): []
      const already = list.includes(meStr)
      const nextCount = already ? prevCount : prevCount + 1

  if (Number.isFinite(max) && max > 0 && nextCount >= max) {
    // Sofort aus UI entfernen → Marker weg
    allBottles.value = allBottles.value.filter(
      b => b.bottle_id !== selectedAllBottle.bottle_id);
    // 🔁 Karte zusätzlich serverseitig neu laden lassen
    window.dispatchEvent(new CustomEvent('refresh-bottles'));
    return;
  } else 
    // vorsichtig lokal hochzählen (nur wenn ich noch nicht gezählt war)
    if (!already) {
        selectedAllBottle.readers_count = nextCount
      selectedAllBottle.reader_ids = [...list, meStr]
    } 
  } 
} 
  catch (err) {
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
    console.log('🟡 sendReply2 called')
 console.log('🧪 currentBottleId in replyLogic:', currentBottleId)
console.log('🧪 currentBottleId.value in replyLogic:', currentBottleId.value)

  console.log('Sending reply:', replyContent.value)
  console.log('Sending reply to bottle:', currentBottleId)
  console.log('Reply content:', replyContent.value)
  
    const me = getUserId()
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
    const response = await axios.post(`${API_BASE}/reply`, {
      bottle_id: currentBottleId.value,
      sender_id: me,     
      receiver_id: receiverId,  
      //content: replyContent.value,
      content,
      reply_to: null
    })

   const data   = response.data || {}
    console.log('✅ Reply sent:', data)
    const status = String(data.status || '').toLowerCase()
    const msg    = data.message || ''

      if (status !== 'success') {
      if (/expired/i.test(msg)) { alert('⏰ Bottle expired.'); return }
      if (/max(imum)? number of readers|limit.*reached/i.test(msg)) { alert('🚫 Limit reached.'); return }
      if (status === 'texterror') { alert('❌ ' + msg); return }
      alert('❌ ' + (msg || 'Failed to send reply.'))
      return
    }

    messageList.value.push({
  sender_id: me,
  sender_nickname: data.sender_nickname || localStorage.getItem('nickname') || localStorage.getItem('username') || me,
  content,
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
moveConversationToTop(selectedConversation.value, content)
// Bei voller Bottle ggf. Karte refreshen
    if (data?.bottle_full) {
      window.dispatchEvent(new CustomEvent('refresh-bottles'))
    }
  } catch (err) {
    console.error('❌ Reply failed:', err)
    alert('Failed to send reply.')
  }
} 
