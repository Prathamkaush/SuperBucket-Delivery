import { authenticatedRequest } from './auth';

export const getReadyOrders = () => authenticatedRequest('/delivery-partner/orders/ready');
export const getMyDeliveries = () => authenticatedRequest('/delivery-partner/orders/my');
export const acceptDelivery = (id) => authenticatedRequest(`/delivery-partner/orders/${id}/accept`, { method: 'PATCH' });
export const markDelivered = (id, otp) => authenticatedRequest(`/delivery-partner/orders/${id}/delivered`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ otp }),
});
export const updateDeliveryLocation = (id, body) => authenticatedRequest(`/delivery-partner/orders/${id}/location`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
