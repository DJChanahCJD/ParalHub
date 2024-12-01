import api from '@/lib/axios'
import type { Scale } from '@/types/api'
import { Tag } from '@/types/common'

// 获取技能列表
export async function getSkills() {
  return await api.get('/common/skills/all')
}

// 获取行业列表
export async function getIndustries() {
  return await api.get('/common/industries/all')
}

// 获取规模列表
export async function getScales() {
  const scaleOptions: Scale[] = [
    { _id: 'small', name: '小型(≤100人)' },
    { _id: 'medium', name: '中型(101-500人)' },
    { _id: 'large', name: '大型(>500人)' },
  ]

  return {
    data: scaleOptions,
  }
}

// 获取标签列表
export const getTags = async (): Promise<{ data: Tag[] }> => {
  const { data } = await api.get('/common/tags/all')
  console.log('data from tags', data)
  return {
    data,
  }
}
