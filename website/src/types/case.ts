import { PaginationParams } from "./pagination"
// 用户基本信息接口
interface Author {
  _id: string
  username: string
  avatar: string
  email?: string
}

// 基础内容接口
interface BaseContent {
  _id: string
  title: string
  content: string
  tags: string[]
  comments?: Comment[]
  createdAt: string | Date
  updatedAt: string | Date
}

// 案例接口
export interface CaseItem extends BaseContent {
  description: string
  stars: number
  authorId: Author
  articleIds?: string[]
  isStarred?: boolean
}

export interface CaseItemQuery extends PaginationParams {
  authorId?: string
  tags?: string[]
  title?: string
}

export interface ArticleQuery extends PaginationParams {
  caseId?: string
  authorId?: string
  tags?: string[]
  title?: string
}

// 案例文章接口
export interface CaseArticle extends BaseContent {
  caseId: string | CaseItem
  description?: string
  authorId: Author
  authorModel: string
  likes: number
  views: number
  commentsCount: number
}
