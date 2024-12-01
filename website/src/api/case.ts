import api from '@/lib/axios'
import { CaseItem, CaseItemQuery } from '@/types/case'
import { PaginatedResponse } from '@/types/pagination'

// 获取案例详情
export const getCaseDetail = async (id: string): Promise<CaseItem> => {
  const { data } = await api.get(`/case/${id}`)
  return data
}

// 获取案例列表
export const getCaseList = async (
  params?: CaseItemQuery,
): Promise<{ items: CaseItem[]; total: number }> => {
  const { data } = await api.get('/case', {
    params
  })
  return data
}

// 点赞案例
export const toggleStarCase = async (caseId: string) => {
  const { data } = await api.post(`/case/${caseId}/star`)
  console.log('starCase: ', data)
  return data
}

export const getCasesByUserId = async (userId: string, query: CaseItemQuery): Promise<PaginatedResponse<CaseItem>> => {
  const { data } = await api.get(`/case/user/${userId}/cases`, { params: query })
  return data
}

export const getCasesCountByUserId = async (userId: string): Promise<number> => {
  const { data } = await api.get(`/case/user/${userId}/count`)
  return data
}

export const getStarCasesByUserId = async (userId: string, query: CaseItemQuery): Promise<PaginatedResponse<CaseItem>> => {
  const { data } = await api.get(`/case/user/${userId}/star-cases`, { params: query })
  return data
}

export const createCase = async (data: Partial<CaseItem>) => {
  const { data: res } = await api.post('/case', data)
  console.log('createCase: ', res)
  return res
}
