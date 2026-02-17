import { apiClient } from '../apiClient';

export type ServiceItem = {
  key: string;
  name: string;
  description: string;
};

export async function listServices(): Promise<ServiceItem[]> {
  const res = await apiClient.get('/services');
  return res.data as ServiceItem[];
}

