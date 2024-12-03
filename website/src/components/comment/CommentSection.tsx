'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/auth-context'
import { useToast } from '@/hooks/use-toast'
import { submitComment, getComments } from '@/api/comment'
import { CommentList } from './CommentList'
import { CommentInput } from './CommentInput'
import { MessageCircleIcon } from 'lucide-react'
import { redirectToLogin } from '@/lib/utils'
import type { Comment, User } from '@/types/comment'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type SortType = 'latest' | 'popular'

type CommentSectionProps = {
  articleId: string
  onCommentChange?: (count: number) => void
  articleAuthorId?: string
}

export default function CommentSection({ articleId, onCommentChange, articleAuthorId }: CommentSectionProps) {
  // 评论输入状态
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 评论列表状态
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalComments, setTotalComments] = useState(0)
  const [sortType, setSortType] = useState<SortType>('latest')

  const { user } = useAuth()
  const { toast } = useToast()

  // 分页参数
  const pageRef = useRef({
    current: 1,
    pageSize: 10,
  })

  // 加载评论列表
  const loadComments = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(true)
      const { current, pageSize } = pageRef.current

      const response = await getComments(articleId, {
        current: isLoadMore ? current + 1 : 1,
        pageSize,
        sortField: sortType === 'latest' ? 'createdAt' : 'likes',
        sortOrder: 'descend'
      })

      console.log('LoadComments from comment section', response.data.data)

      const commentsWithLikeStatus = response.data.data.map(comment => ({
        ...comment,
        isLiked: comment.likedBy?.includes(user?._id || ''),
      }))

      setComments(prev =>
        isLoadMore ? [...prev, ...commentsWithLikeStatus] : commentsWithLikeStatus
      )
      setHasMore(response.data.data.length >= pageSize)
      setTotalComments(response.data.total)
      onCommentChange?.(response.data.total)

      if (isLoadMore) {
        pageRef.current.current += 1
      }
    } catch (error) {
      toast({
        title: '加载失败',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [articleId, user?._id, sortType, onCommentChange, toast])

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: '请先登录', variant: 'destructive' })
      return
    }
    if (!content.trim()) return
    if (content.trim().length > 1024) {
      toast({ title: '评论内容过长', variant: 'destructive' })
      return
    }
    if (content.trim().length < 4) {
      toast({ title: '评论内容过于简短', variant: 'destructive' })
      return
    }

    try {
      setSubmitting(true)
      await submitComment(articleId, {
        content: content.trim(),
        type: 'comment'
      })

      setContent('')
      // 重新加载评论列表
      pageRef.current.current = 1
      await loadComments()

      toast({
        title: '发布成功',
        className: 'bg-primary text-primary-foreground',
      })
    } catch (error) {
      toast({
        title: '发布失败',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 处理评论更新
  const handleCommentUpdate = useCallback((updatedComment: Comment) => {
    if (updatedComment.deleted) {
      setComments(prev => {
        const newComments = prev.filter(comment => {
          if (comment._id === updatedComment._id) {
            // 删除主评论
            setTotalComments(count => {
              const newCount = count - 1
              onCommentChange?.(newCount)
              return newCount
            })
            return false
          }
          if (updatedComment.type === 'reply' && comment._id === updatedComment.parentId) {
            // 更新父评论的回复数
            return {
              ...comment,
              replyCount: Math.max(0, (comment.replyCount || 0) - 1)
            }
          }
          return true
        })
        return newComments
      })
    } else {
      // 其他更新操作（点赞等）
      setComments(prev => prev.map(comment => {
        if (comment._id === updatedComment._id) {
          return updatedComment
        }
        // 处理回复的更新
        if (comment._id === updatedComment.parentId) {
          return {
            ...comment,
            replyCount: (comment.replyCount || 0) + 1
          }
        }
        return comment
      }))
    }
  }, [onCommentChange])

  // 处理排序变更
  const handleSortChange = useCallback((value: SortType) => {
    setSortType(value)
    pageRef.current.current = 1
    loadComments()
  }, [loadComments])

  // 初始加载
  useEffect(() => {
    loadComments()
  }, [loadComments])

  return (
    <div className="space-y-6 p-6">
      {/* 评论区头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center">
            <MessageCircleIcon className="w-4 h-4 mr-2" />
            评论
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({totalComments})
            </span>
          </h3>
        </div>
        <Select
            defaultValue="latest"
            onValueChange={handleSortChange}

          >
            <SelectTrigger className="w-[100px] h-8 text-sm">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">最新发布</SelectItem>
              <SelectItem value="popular">最受欢迎</SelectItem>
            </SelectContent>
          </Select>
      </div>

      {/* 主评论输入框 */}
      {user ? (
        <div className="pb-6 border-b">
          <CommentInput
            content={content}
            setContent={setContent}
            loading={submitting}
            onSubmit={handleSubmitComment}
            className="w-full"
          />
        </div>
      ) : (
        <div className="text-center py-3 border rounded-lg bg-muted/50 text-sm">
          <span onClick={redirectToLogin} className="text-primary hover:underline cursor-pointer">
            登录
          </span>
          后参与评论
        </div>
      )}

      {/* 评论列表 */}
      <CommentList
        comments={comments}
        currentUser={user as User}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={() => loadComments(true)}
        onCommentUpdate={handleCommentUpdate}
        articleAuthorId={articleAuthorId}
      />
    </div>
  )
}
