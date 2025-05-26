export async function getOrCreateUserId() {
  let userId = localStorage.getItem("user_id");
  if (!userId) {
    const response = await fetch("http://127.0.0.1:8000/auth/anon");
    const data = await response.json();
    userId = data.user_id;
    localStorage.setItem("user_id", userId);
  }
  return userId;
}

