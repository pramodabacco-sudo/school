//client\src\auth\api.js
const API = import.meta.env.VITE_API_URL;

export const loginRequest = async (type, credentials) => {
  const response = await fetch(`${API}/api/auth/${type}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};
