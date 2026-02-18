import { apiClient } from '../apiClient';

export type OrderStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'canceled';

export type OrderTimelineEvent = {
  status: OrderStatus;
  at: string;
  by?: string;
  note?: string;
};

export type OrderRating = {
  stars: number;
  note?: string;
  at: string;
};

export type Order = {
  _id: string;
  customerId: string;
  providerId?: string;
  serviceKey: string;
  title: string;
  description?: string;
  address?: string;
  country: string;
  state: string;
  lga: string;
  verificationCode?: string;
  verificationVerifiedAt?: string;
  customerRating?: OrderRating;
  handymanRating?: OrderRating;
  scheduledAt?: string;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
};

export async function createOrder(input: {
  serviceKey: string;
  title: string;
  description?: string;
  address?: string;
  country: string;
  state: string;
  lga: string;
  scheduledAt?: string;
}): Promise<Order> {
  const res = await apiClient.post('/orders', input);
  return res.data as Order;
}

export async function listMyOrders(): Promise<Order[]> {
  const res = await apiClient.get('/orders');
  return res.data as Order[];
}

export async function getOrder(orderId: string): Promise<Order> {
  const res = await apiClient.get(`/orders/${orderId}`);
  return res.data as Order;
}

export async function listMarketplaceOrders(): Promise<Order[]> {
  const res = await apiClient.get('/marketplace/orders');
  return res.data as Order[];
}

export async function acceptOrder(orderId: string): Promise<Order> {
  const res = await apiClient.post(`/orders/${orderId}/accept`, {});
  return res.data as Order;
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
  verificationCode?: string,
): Promise<Order> {
  const res = await apiClient.post(`/orders/${orderId}/status`, { status, note, verificationCode });
  return res.data as Order;
}

export async function rateOrder(orderId: string, input: { stars: number; note?: string }): Promise<Order> {
  const res = await apiClient.post(`/orders/${orderId}/rate`, input);
  return res.data as Order;
}
