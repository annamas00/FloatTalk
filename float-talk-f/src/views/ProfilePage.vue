<template>
    <div class="profile-page">
        <div class="profile-card">
            <router-link to="/home" class="back-button" title="Back to map">←</router-link>
            <h2 class="profile-title">👤 My Profile</h2>
            <div class="form-group">
                <label>Email</label>
                <input type="text" :value="email" disabled />
            </div>

            <div class="form-group">
                <label>Nickname</label>
                <input type="text" v-model="nickname" />
            </div>

            <div class="btn-row">
                <button @click="updateProfile" class="btn-primary">Save Changes</button>
                <button @click="logout" class="btn-secondary">Logout</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const router = useRouter()
const email = ref('')
const nickname = ref('')

onMounted(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
        router.push('/login')
        return
    }

    try {
        const res = await axios.get(`${API_BASE}/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        email.value = res.data.email
        nickname.value = res.data.nickname
    } catch (err) {
        alert('❌ Failed to load profile')
        console.error(err)
    }
})

//when updating profile
async function updateProfile() {
    const token = localStorage.getItem('token')
    try {
        await axios.put(`${API_BASE}/me`, { nickname: nickname.value }, {
            headers: { Authorization: `Bearer ${token}` }
        })
        localStorage.setItem('nickname', nickname.value)
        alert('✅ Nickname updated!')
    } catch (err) {
        alert('❌ Failed to update profile')
        console.error(err)
    }
}

//for log out
function logout() {
    localStorage.clear()
    alert('👋 Logged out.')
    router.push('/login')
}
</script>

<style scoped>
.profile-page {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f9fafb;
}

.profile-card {
    position: relative;
    background-color: white;
    padding: 2.5rem 2rem;
    border-radius: 1rem;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
    width: 100%;
    max-width: 340px;
    text-align: center;
    animation: fadeIn 0.5s ease forwards;
    transform: scale(0.95);
    opacity: 0;
}

@keyframes fadeIn {
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.profile-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 2rem;
}

.form-group {
    margin-bottom: 1rem;
    text-align: left;
}

.form-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: #fefce8;
    box-sizing: border-box;
    line-height: 1.25;
}

.form-group input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    outline: none;
}

.btn-row {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.btn-primary {
    background-color: #4f46e5;
    color: white;
    padding: 0.5rem;
    width: 100%;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.btn-primary:hover {
    background-color: #4338ca;
}

.btn-secondary {
    background-color: #e11d48;
    /* Rose-600 */
    color: white;
    padding: 0.5rem;
    width: 100%;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.btn-secondary:hover {
    background-color: #be123c;
}

.back-button {
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    font-size: 2rem;
    color: black;
    text-decoration: none;
    transition: color 0.2s ease;
}

.back-button:hover {
    color: #4338ca;
}
</style>
