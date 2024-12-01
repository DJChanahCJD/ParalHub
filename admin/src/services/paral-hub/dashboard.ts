import { request } from '@umijs/max';

export async function getDashboardOverview() {
  return request('/api/admin/dashboard/overview');
}
