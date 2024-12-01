import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface CommentInputProps {
  content: string
  setContent: (content: string) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  className?: string
}

export const CommentInput = memo(function CommentInput({
  content,
  setContent,
  loading,
  onSubmit,
  className,
}: CommentInputProps) {
  const handleCancel = () => {
    setContent('')
  }

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4">
          <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"写下你的评论..."}
          className="min-h-[100px]"
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            取消
          </Button>
          <Button type="submit" disabled={!content.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                发布中...
              </>
            ) : (
              '发布'
            )}
          </Button>
        </div>
        </div>
      </form>
    </div>
  )
})