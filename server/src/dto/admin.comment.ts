import { PaginationQuery } from './pagination';

// 管理员评论查询
export interface AdminCommentQuery extends PaginationQuery {
  // 评论内容搜索
  content?: string;

  // 用户名搜索（关联查询）
  'userId.username'?: string;

  // 文章标题搜索（关联查询）
  'articleId.title'?: string;

  // 文章ID搜索（关联查询）
  'articleId._id'?: string;

  // 评论类型
  type?: 'comment' | 'reply';

  // 父评论ID搜索（关联查询）
  parentId?: string;

  // 排序字段
  sortField?: 'likes' | 'replyCount' | 'createdAt';

  // 排序方式
  sortOrder?: 'ascend' | 'descend';
}
