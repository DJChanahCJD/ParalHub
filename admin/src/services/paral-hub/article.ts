import { request } from '@umijs/max';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/** 获取文章列表 GET /article */
export async function getArticles(params: API.ArticleParams) {
  return request<API.ArticleResponse>(`${API_URL}/article`, {
    method: 'GET',
    params: {
      ...params,
      // 处理数组参数
      tags: params.tags?.join(','),
    },
  });
}

/** 获取单个文章 GET /article/${id} */
export async function getArticle(id: string) {
  return request<API.ArticleItem>(`${API_URL}/article/${id}`, {
    method: 'GET',
  });
}

/** 新建文章 POST /article */
export async function addArticle(data: Partial<API.ArticleItem>) {
  return request<API.ArticleItem>(`${API_URL}/article`, {
    method: 'POST',
    data,
  });
}

/** 更新文章 PUT /article/${id} */
export async function updateArticle(id: string, data: Partial<API.ArticleItem>) {
  return request<API.ArticleItem>(`${API_URL}/article/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 删除文章 DELETE /article/${id} */
export async function deleteArticle(id: string) {
  return request<Record<string, any>>(`${API_URL}/article/${id}`, {
    method: 'DELETE',
  });
}

/** 获取案例的相关文章 GET /article/case/${caseId} */
export async function getArticlesByCaseId(caseId: string) {
  return request<API.ArticleItem[]>(`${API_URL}/article/case/${caseId}`, {
    method: 'GET',
  });
}

/** 点赞文章 POST /article/${id}/like */
export async function likeArticle(id: string) {
  return request<API.ArticleItem>(`${API_URL}/article/${id}/like`, {
    method: 'POST',
  });
}
