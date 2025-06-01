// logger.js
const baseURL = import.meta.env.VITE_API_URL;

export async function logEvent(action, details = {}) {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const body = { user_id: userId, action, details };

  await fetch(`${baseURL}/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

