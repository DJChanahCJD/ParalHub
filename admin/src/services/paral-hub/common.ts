import { request } from '@umijs/max';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
/** 获取所有技能 */
export async function getAllSkills(): Promise<API.SkillItem[]> {
  return await request<API.SkillItem[]>(`${API_URL}/common/skills/all`);
}

/** 获取技能列表 */
export async function getSkillList(params: API.PageParams): Promise<API.PageResult<API.SkillItem>> {
  return await request<API.PageResult<API.SkillItem>>(`${API_URL}/common/skills`, {
    params,
  });
}

/** 创建技能 */
export async function createSkill(data: Partial<API.SkillItem>): Promise<void> {
  return await request<void>(`${API_URL}/common/skills`, {
    method: 'POST',
    data,
  });
}

/** 更新技能 */
export async function updateSkill(id: string, data: Partial<API.SkillItem>): Promise<void> {
  return await request<void>(`${API_URL}/common/skills/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 删除技能 */
export async function deleteSkill(id: string): Promise<void> {
  return await request<void>(`${API_URL}/common/skills/${id}`, {
    method: 'DELETE',
  });
}

/** 获取所有行业 */
export async function getAllIndustries(): Promise<API.IndustryItem[]> {
  return await request<API.IndustryItem[]>(`${API_URL}/common/industries/all`);
}

/** 获取行业列表 */
export async function getIndustryList(params: API.PageParams): Promise<API.PageResult<API.IndustryItem>> {
  return await request<API.PageResult<API.IndustryItem>>(`${API_URL}/common/industries`, {
    params,
  });
}

/** 创建行业 */
export async function createIndustry(data: Partial<API.IndustryItem>): Promise<void> {
  return await request<void>(`${API_URL}/common/industries`, {
    method: 'POST',
    data,
  });
}

/** 更新行业 */
export async function updateIndustry(id: string, data: Partial<API.IndustryItem>): Promise<void> {
  return await request<void>(`${API_URL}/common/industries/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 删除行业 */
export async function deleteIndustry(id: string): Promise<void> {
  return await request<void>(`${API_URL}/common/industries/${id}`, {
    method: 'DELETE',
  });
}

/** 获取标签列表 */
export async function getTagList(params: API.PageParams): Promise<API.PageResult<API.TagItem>> {
  return await request<API.PageResult<API.TagItem>>(`${API_URL}/common/tags`, {
    params,
  });
}

/** 创建标签 */
export async function createTag(data: Partial<API.TagItem>): Promise<void> {
  return await request<void>(`${API_URL}/common/tags`, {
    method: 'POST',
    data,
  });
}

/** 更新标签 */
export async function updateTag(id: string, data: Partial<API.TagItem>): Promise<void> {
  return await request<void>(`${API_URL}/common/tags/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 删除标签 */
export async function deleteTag(id: string): Promise<void> {
  return await request<void>(`${API_URL}/common/tags/${id}`, {
    method: 'DELETE',
  });
}
