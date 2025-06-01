export async function logEvent(action, details = {}) {
  if (import.meta.env.PROD) return;

  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const body = { user_id: userId, action, details };

  await fetch(`${import.meta.env.VITE_API_URL}/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

