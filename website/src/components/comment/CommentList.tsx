import { memo } from "react"
import { CommentItem } from "./CommentItem"
import { Button } from "../ui/button"
import { Loader2 } from "lucide-react"
import type { Comment, User } from "@/types/comment"

interface CommentListProps {
  comments: Comment[]
  currentUser?: User | null
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onCommentUpdate: (comment: Comment) => void
  articleAuthorId?: string
}

export const CommentList = memo(function CommentList({
  comments,
  currentUser,
  loading,
  hasMore,
  onLoadMore,
  onCommentUpdate,
  articleAuthorId
}: CommentListProps) {
  return (
    <div className="space-y-6">
      {comments.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          暂无评论，快来发表第一条评论吧
        </div>
      ) : (
        <div className="space-y-6 divide-y divide-border">
          {comments.map(comment => (
            <div key={comment._id} className="pt-6 first:pt-0">
              <CommentItem
                comment={comment}
                currentUser={currentUser}
                onCommentUpdate={onCommentUpdate}
                articleAuthorId={articleAuthorId}
              />
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={onLoadMore}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              加载中...
            </>
          ) : (
            '加载更多评论'
          )}
        </Button>
      )}
    </div>
  )
})