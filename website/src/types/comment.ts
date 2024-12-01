import type { User } from './user'
export type { User } from './user'

export interface Comment {
    _id: string
    content: string
    userId?: {
        _id: string
        username: string
        avatar: string
        role: string
    }
    articleId?: string | {
        _id: string
    }
    createdAt: string
    likes: number
    likedBy: string[]
    type: 'comment' | 'reply'
    parentId?: string | null
    replyToId?: string | null
    replyToUser?: User
    replyToUserId?: {
        _id: string
        username: string
    }
    deleted?: boolean
    replyCount: number
    isLiked?: boolean
}

interface CreateCommentDtoBase {
    content: string
    articleId?: string
}

export interface CreateCommentDto extends CreateCommentDtoBase {
    type?: 'comment'
}

export interface CreateReplyDto extends CreateCommentDtoBase {
    parentId?: string | null
    replyToId?: string | null
    replyToUserId?: string | null
    type: 'reply'
}

export interface CommentProps {
    articleId: string
    currentUser?: User | null
}

export interface CommentQuery {
    pageSize?: number
    current?: number
    sortField?: string
    sortOrder?: 'ascend' | 'descend'
}

export interface ReplyTo {
    commentId: string
    userId: string
    user?: User
    parentId?: string
}
