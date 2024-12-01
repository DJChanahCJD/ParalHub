import axios from '@/lib/axios'
import type { Comment, CreateCommentDto, CreateReplyDto } from '@/types/comment'
import type { PaginatedResponse, PaginationParams } from '@/types/pagination'
export const getComments = (articleId: string, params: PaginationParams) =>
  axios.get<PaginatedResponse<Comment>>(`/comment/article/${articleId}`, { params })

export const submitComment = (articleId: string, data: CreateCommentDto) =>
  axios.post<Comment>(`/comment/article/${articleId}`, data)

export const likeComment = (commentId: string, articleId: string) =>
  axios.post<{ likes: number; isLiked: boolean }>(`/comment/${commentId}/like?articleId=${articleId}`)

export const getReplies = (commentId: string, params: PaginationParams) =>
  axios.get<PaginatedResponse<Comment>>(`/comment/${commentId}/replies`, { params })

export const addReply = (commentId: string, data: CreateReplyDto) =>
  axios.post<Comment>(`/comment/${commentId}/reply`, data)

export const deleteComment = (commentId: string) =>
  axios.delete(`/comment/delete/${commentId}`)
