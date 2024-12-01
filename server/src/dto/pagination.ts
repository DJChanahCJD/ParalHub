import { UserRole } from '../schema/users.schema';

export interface PaginationQuery {
  current?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'descend' | 'ascend';
}

export interface CaseQuery extends PaginationQuery {
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  authorId?: string;
}

export interface NoticeQuery extends PaginationQuery {
  title?: string;
  content?: string;
  status?: string;
  target?: string;
  publishTime?: string;
  expireTime?: string;
  username?: string;
  creator?: string;
}

export interface ArticleQuery extends PaginationQuery {
  caseId?: string;
  content?: string;
  authorId?: string;
  tags?: string[];
  title?: string;
}

export interface ArticleCommentQuery extends PaginationQuery {
  articleId?: string;
}

export interface CommentQuery extends PaginationQuery {
  content?: string;
  username?: string;
  articleId?: string;
}

export interface ReplyQuery extends PaginationQuery {
  content?: string;
  mentionedUsername?: string;
  parentId?: string;
}

export interface FollowQuery extends PaginationQuery {
  role?: UserRole;
  username?: string;
}
