import { request } from '@umijs/max';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
// 定义查询参数接口
export interface CommentQueryParams {
  current?: number;
  pageSize?: number;
  content?: string;
  'userId.username'?: string;
  'articleId.title'?: string;
  'articleId._id'?: string;
  type?: 'comment' | 'reply';
  parentId?: string;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

// 获取评论列表
export async function getComments(params: CommentQueryParams) {
  return request(`${API_URL}/admin/comment/list`, {
    method: 'GET',
    params,
  });
}

// 删除评论
export async function deleteComment(id: string) {
  return request(`${API_URL}/admin/comment/delete/${id}`, {
    method: 'DELETE',
  });
}

// 添加评论
export async function addComment(data: Partial<API.CommentItem>) {
  console.log('data from addComment', data);
  return request(`${API_URL}/admin/comment/create`, {
    method: 'POST',
    data,
  });
}
