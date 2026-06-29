export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3030').replace(/\/$/, '');
export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(Array.isArray(data?.message) ? data.message.join(', ') : data?.message || `Request failed (${response.status})`);
  return data;
}
