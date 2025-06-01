const baseURL = import.meta.env.VITE_API_URL;

export async function getOrCreateUserId() {
  let userId = localStorage.getItem("user_id");
  if (!userId) {
    const response = await fetch(`${baseURL}/auth/anon`);
    const data = await response.json();
    userId = data.user_id;
    localStorage.setItem("user_id", userId);
  }
  return userId;
}

