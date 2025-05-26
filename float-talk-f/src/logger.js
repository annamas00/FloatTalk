export async function logEvent(action, details = {}) {
  const userId = localStorage.getItem("user_id");
  if (!userId) return;

  const body = {
    user_id: userId,
    action,
    details
  };

  await fetch("http://127.0.0.1:8000/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

