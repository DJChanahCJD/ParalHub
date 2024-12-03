import api from '@/lib/axios'
import { CaseArticle, ArticleQuery } from '@/types/case'
import { PaginatedResponse } from '@/types/pagination'

// 获取案例文章列表
export const getCaseArticles = async (
  caseId: string,
  params: ArticleQuery = { current: 1, pageSize: 10 }
): Promise<PaginatedResponse<CaseArticle>> => {
  const { data } = await api.get(`/case/${caseId}/articles`, {
    params: {
      current: params.current,
      pageSize: params.pageSize,
      sortField: params.sortField || 'updatedAt',
      sortOrder: params.sortOrder || 'descend',
      ...params
    }
  })
  return data
}

  // 创建案例文章
  export const createCaseArticle = async (
    caseId: string,
    data: {
      content: string;
      title: string;
      description?: string;
      tags: string[];
    }
  ) => {
    console.log('createCaseArticle: ', data)
    const { data: responseData } = await api.post(`/case/${caseId}/articles`, data);
    return responseData;
  }

  // 获取文章详情
  export const getCaseArticleDetail = async (caseId: string, articleId: string): Promise<CaseArticle> => {
    const { data } = await api.get(`/case/${caseId}/articles/${articleId}`)
    return data
  }

  // 仅根据文章ID获取文章详情
  export const getArticleById = async (articleId: string): Promise<CaseArticle> => {
    const { data } = await api.get(`/article/${articleId}`)
    return data
  }

  // 点赞文章
  export const likeCaseArticle = async (caseId: string, articleId: string) => {
    const { data } = await api.post(`/case/${caseId}/articles/${articleId}/like`)
    return data
  }

  // 浏览文章
  export const viewCaseArticle = async (caseId: string, articleId: string) => {
    const { data } = await api.post(`/case/${caseId}/articles/${articleId}/view`)
    return data
  }

export const getArticlesByUserId = async (
  userId: string,
  query: ArticleQuery,
): Promise<PaginatedResponse<CaseArticle>> => {
  const { data } = await api.get(`/article/user/${userId}`, { params: query })
  return data
}

// 更新文章
export const updateArticle = async (
  articleId: string,
  data: Partial<CaseArticle>
) => {
  const { data: res } = await api.put(`/article/${articleId}`, data)
  return res
}

// 删除文章
export const deleteArticle = async (articleId: string) => {
  const { data } = await api.delete(`/article/${articleId}`)
  return data
}
