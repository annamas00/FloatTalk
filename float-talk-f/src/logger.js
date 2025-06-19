const API_URL = import.meta.env.VITE_API_URL;

export async function getOrCreateUserId() {
  let userId = localStorage.getItem("user_id");
  if (!userId) {
    const response = await fetch(`${API_URL}/auth/anon`);
    const data = await response.json();
    userId = data.user_id;
    localStorage.setItem("user_id", userId);
  }
  return userId;
}

export async function register(email, password) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  return await response.json(); 
}

// Login and store token
export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  const { access_token } = await response.json();
  localStorage.setItem("token", access_token);
  return access_token;
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) return null;
  const user = await response.json();
  localStorage.setItem("user_id", user.user_id); 
  return user;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
}


