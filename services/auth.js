import * as SecureStore from 'expo-secure-store';
import { apiRequest } from './api';
export const getToken = () => SecureStore.getItemAsync('auth_token');
export async function authenticatedRequest(path, options = {}) { const token = await getToken(); if (!token) throw new Error('Please log in again'); return apiRequest(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } }); }
export async function loginDeliveryPartner(email, password) { const data = await apiRequest('/auth/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); if (data.user?.role !== 'DELIVERY_PARTNER') throw new Error('This account is not a delivery partner account'); await SecureStore.setItemAsync('auth_token', data.token); await SecureStore.setItemAsync('auth_user', JSON.stringify(data.user)); return data; }
export async function registerDeliveryPartner(body) { return apiRequest('/auth/delivery/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
export async function getStoredUser() { const value = await SecureStore.getItemAsync('auth_user'); return value ? JSON.parse(value) : null; }
export const sendOtp = (phone) => apiRequest('/auth/phone/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
export async function verifyOtp(challengeToken, otp) { const data = await apiRequest('/auth/phone/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeToken, otp }) }); await SecureStore.setItemAsync('auth_token', data.token); await SecureStore.setItemAsync('auth_user', JSON.stringify(data.user)); return data; }
export async function logout() { await SecureStore.deleteItemAsync('auth_token'); await SecureStore.deleteItemAsync('auth_user'); }
