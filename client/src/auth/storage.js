//client\src\auth\storage.js
export const saveAuth = (data) => {
  localStorage.setItem("auth", JSON.stringify(data));
};

export const getAuth = () => {
  const raw = localStorage.getItem("auth");
  return raw ? JSON.parse(raw) : null;
};

export const clearAuth = () => {
  localStorage.removeItem("auth");
};

