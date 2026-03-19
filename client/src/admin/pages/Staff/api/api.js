import { getToken } from "../../../../auth/storage";

const API_URL = import.meta.env.VITE_API_URL;
const BASE = `${API_URL}/api/staff/profiles`;

const authHeaders = (isJson = false) => {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
    "Cache-Control": "no-store",
  };
  if (isJson) headers["Content-Type"] = "application/json";
  return headers;
};

const toQuery = (params) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v != null) s.set(k, v);
  });
  return s.toString();
};

// ✅ Helper: throw on non-2xx responses so catch blocks actually trigger
const handleResponse = async (r) => {
  const data = await r.json();
  if (!r.ok) {
    // Use server's error message if available, else fallback
    throw new Error(data?.error || `Request failed (${r.status})`);
  }
  return data;
};

// ✅ GET STAFF
export const fetchStaff = (filters) =>
  fetch(`${BASE}?${toQuery(filters)}`, {
    headers: authHeaders(),
  }).then(handleResponse);

// ✅ CREATE STAFF
export const createStaff = (data) =>
  fetch(BASE, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  }).then(handleResponse);

// ✅ UPDATE
export const updateStaff = (id, data) =>
  fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  }).then(handleResponse);

// ✅ DELETE
export const deleteStaff = (id) =>
  fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  }).then(handleResponse);