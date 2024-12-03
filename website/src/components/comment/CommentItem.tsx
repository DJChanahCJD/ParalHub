import { memo, useState, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThumbsUp, MessageCircle, ChevronDown, Loader2, Trash2, Reply, Crown } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { Comment, User } from '@/types/comment'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { addReply, likeComment, deleteComment, getReplies } from '@/api/comment'
import router from 'next/router'

interface CommentItemProps {
  comment: Comment
  currentUser?: User | null
  onCommentUpdate?: (comment: Comment) => void
  articleAuthorId?: string
}

// 统一的按钮样式常量
const BUTTON_STYLES = {
  base: "h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground",
  icon: "w-4 h-4 mr-1",
  text: "text-sm",
  danger: "text-destructive hover:text-destructive hover:bg-destructive/10",
  active: "text-primary",
  loading: "animate-spin",
} as const

export const CommentItem = memo(function CommentItem({
  comment: initialComment,
  currentUser,
  onCommentUpdate,
  articleAuthorId
}: CommentItemProps) {
  const [comment, setComment] = useState(initialComment)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replies, setReplies] = useState<Comment[]>([])
  const [replyTotal, setReplyTotal] = useState(0)
  const [replyPage, setReplyPage] = useState(1)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const { toast } = useToast()

  const handleToggleExpand = useCallback(async () => {
    if (!isExpanded && replies.length === 0) {
      loadReplies()
    }
    setIsExpanded(!isExpanded)
  }, [isExpanded, replies.length])

  const handleLike = async () => {
    if (!currentUser) {
      toast({ title: '请先登录', variant: 'destructive' })
      return
    }

    try {
      await likeComment(comment._id, typeof comment.articleId === 'object' ?
        comment.articleId?._id :
        comment.articleId || '')
      setComment(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1
      }))
    } catch (error) {
      toast({ title: '操作失败', description: String(error), variant: 'destructive' })
    }
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !replyContent.trim()) return
    if (replyContent.trim().length > 1024) {
      toast({ title: '回复内容过长', variant: 'destructive' })
      return
    }
    if (replyContent.trim().length < 4) {
      toast({ title: '回复内容过于简短', variant: 'destructive' })
      return
    }
    try {
      setIsSubmitting(true)
      const parentId = comment.type === 'reply' ? comment.parentId : comment._id

      const response = await addReply(parentId!, {
        content: replyContent.trim(),
        type: 'reply',
        parentId,
        replyToId: comment._id,
        replyToUserId: comment.userId?._id,
        articleId: typeof comment.articleId === 'object' ?
          comment.articleId?._id :
          comment.articleId,
      })

      onCommentUpdate?.({
        ...comment,
        replyCount: (comment.replyCount || 0) + 1,
      })
      setReplies(prev => [...prev, response.data as Comment])
      setReplyTotal(prev => prev + 1)
      setComment(prev => ({
        ...prev,
        replyCount: (prev.replyCount || 0) + 1
      }))

      setReplyContent('')
      setShowReplyInput(false)
      setIsExpanded(true)
      toast({ title: '回复成功' })
    } catch (error) {
      toast({ title: '回复失败', description: String(error), variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentUser) return

    try {
      await deleteComment(comment._id)

      if (comment.type === 'reply') {
        // 如果是回复，通知父评论更新回复数和列表
        onCommentUpdate?.({
          ...comment,
          deleted: true,
          type: 'reply',
          parentId: comment.parentId
        })

      } else {
        // 如果是主评论，直接标记删除
        setComment(prev => ({ ...prev, deleted: true }))
        // 需要通知父组件从列表中移除
        onCommentUpdate?.({
          ...comment,
          deleted: true
        })
      }

      toast({ title: '删除成功' })
    } catch (error) {
      toast({
        title: '删除失败',
        description: String(error),
        variant: 'destructive'
      })
    }
  }

  const loadReplies = async (isLoadMore = false) => {
    if (!comment._id) return

    try {
      setLoadingReplies(true)
      const response = await getReplies(comment._id, {
        current: isLoadMore ? replyPage + 1 : 1,
        pageSize: 5,
        sortField: 'createdAt',
        sortOrder: 'ascend',
      })

      const repliesWithLikeStatus = response.data.data.map(reply => ({
        ...reply,
        isLiked: reply.likedBy?.includes(currentUser?._id || ''),
      }))

      setReplies(prev =>
        isLoadMore ? [...prev, ...repliesWithLikeStatus] : repliesWithLikeStatus
      )
      setReplyTotal(response.data.total)
      if (isLoadMore) {
        setReplyPage(prev => prev + 1)
      }
    } catch (error) {
      toast({
        title: '加载回复失败',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setLoadingReplies(false)
    }
  }

  function navigateToUserProfile() {
    if (!comment.userId?.username) {
      return null
    }

    router.push(`/profile/${comment.userId._id}`)
  }

  return (
    <div className={cn(
      "space-y-4 group/comment",
      comment.type === 'reply' && "bg-muted/50 rounded-lg p-3"
    )}>
      <div className="w-full group/item">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer hover:text-primary" onClick={navigateToUserProfile}>
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.userId?.avatar || ''} alt={comment.userId?.username || '注销用户'} />
                <AvatarFallback>{comment.userId?.username[0] || '注'}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="font-medium hover:underline">{comment.userId?.username || '注销用户'}</span>
                {articleAuthorId === comment.userId?._id && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                    <Crown className="h-4 w-4 inline-block mr-1" />
                    作者
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          <div className="text-sm">
            {comment.type === 'reply' && comment.replyToUserId && comment.replyToId !== comment.parentId && (
              <span className="text-primary cursor-pointer hover:underline" onClick={navigateToUserProfile}>@{comment.replyToUserId.username} </span>
            )}
            {comment.content}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                BUTTON_STYLES.base,
                comment.isLiked && BUTTON_STYLES.active
              )}
            >
              <ThumbsUp className={cn(
                BUTTON_STYLES.icon,
                comment.isLiked && "fill-primary"
              )} />
              <span className={BUTTON_STYLES.text}>{comment.likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyInput(true)}
              className={BUTTON_STYLES.base}
            >
              <Reply className={BUTTON_STYLES.icon} />
              <span className={BUTTON_STYLES.text}>回复</span>
            </Button>
            {comment.type === 'comment' && comment.replyCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleExpand}
                className={BUTTON_STYLES.base}
              >
                {isExpanded ? (
                  <>
                    <MessageCircle className={BUTTON_STYLES.icon} />
                    <span className={BUTTON_STYLES.text}>收起回复</span>
                  </>
                ) : (
                  <>
                    {loadingReplies ? (
                      <Loader2 className={cn(BUTTON_STYLES.icon, BUTTON_STYLES.loading)} />
                    ) : (
                      <>
                        <MessageCircle className={BUTTON_STYLES.icon} />
                        <span className={BUTTON_STYLES.text}>
                          展开 {comment.replyCount} 条回复
                        </span>
                      </>
                    )}
                  </>
                )}
              </Button>
            )}
            {currentUser?._id === comment.userId?._id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className={cn(
                  BUTTON_STYLES.base,
                  BUTTON_STYLES.danger,
                  "opacity-0 group-hover/comment:opacity-100 transition-opacity"
                )}
              >
                <Trash2 className={BUTTON_STYLES.icon} />
                <span className={BUTTON_STYLES.text}>删除</span>
              </Button>
            )}
          </div>

          {showReplyInput && (
            <div className="mt-4">
              <form onSubmit={handleReplySubmit} className="space-y-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`回复 ${comment.userId?.username}...`}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowReplyInput(false)
                      setReplyContent('')
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        回复中...
                      </>
                    ) : '发布'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {isExpanded && replies.length > 0 && (
            <div className="space-y-4 border-l-2 border-border ml-2 pl-4 mt-4">
              {replies.map(reply => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  currentUser={currentUser}
                  onCommentUpdate={(updatedReply) => {
                    if (updatedReply.deleted) {
                      setReplies(prev => prev.filter(r => r._id !== updatedReply._id))
                      setComment(prev => ({
                        ...prev,
                        replyCount: Math.max(0, (prev.replyCount || 0) - 1)
                      }))
                      setReplyTotal(prev => Math.max(0, prev - 1))
                    } else {
                      setReplies(prev => prev.map(r =>
                        r._id === updatedReply._id ? updatedReply : r
                      ))
                    }
                  }}
                />
              ))}

              {replyTotal > replies.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadReplies(true)}
                  disabled={loadingReplies}
                  className={BUTTON_STYLES.base}
                >
                  {loadingReplies ? (
                    <Loader2 className={cn(BUTTON_STYLES.icon, BUTTON_STYLES.loading)} />
                  ) : (
                    <>
                      <ChevronDown className={BUTTON_STYLES.icon} />
                      <span className={BUTTON_STYLES.text}>
                        加载更多回复
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})