export async function getOrCreateUserId() {
  if (import.meta.env.PROD) return null;

  let userId = localStorage.getItem("user_id");
  if (!userId) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/anon`);
    const data = await response.json();
    userId = data.user_id;
    localStorage.setItem("user_id", userId);
  }
  return userId;
}

