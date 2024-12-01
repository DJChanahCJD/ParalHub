import { CaseArticle } from '@/types/case'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Eye, MessageSquare, ThumbsUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
interface ArticleCardProps {
  article: CaseArticle
  className?: string
  onClick?: () => void
  isSelected?: boolean
  caseId?: string
}

export function ArticleCard({ article, className, onClick, isSelected, caseId }: ArticleCardProps) {
  // 从文章内容中提取标题和预览
  const lines = article.content.split('\n')
  const title = lines[0].replace('# ', '')
  const preview = article.content.slice(0, Math.min(64, article.content.length))

  // 如果没有提供 onClick，则使用默认的链接处理
  const handleClick = onClick || (() => {
    if (caseId && article._id) {
      // 使用 window.location.href 进行导航
      window.location.href = `/case/${caseId}/article/${article._id}`
    }
  })

  return (
    <Card
      className={cn(
        "hover:border-primary/50 transition-colors",
        isSelected && "border-primary bg-primary/5",
        onClick && "cursor-pointer",
        className
      )}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
    >
      <CardHeader className="p-4">
        <div className="space-y-3">
          {/* 标题和标签 */}
          <div>
            <CardTitle className="text-lg font-semibold mb-2">
              {title}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {article.tags?.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 预览内容 */}
          <p className="text-sm text-muted-foreground line-clamp-1">
            {preview}
          </p>

          {/* 作者信息和统计 */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={article.authorId?.avatar || ''} />
                <AvatarFallback>
                  {article.authorId?.username.charAt(0).toUpperCase() || '注'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {article.authorId?.username || '注销用户'}
              </span>
              <span className="text-sm text-muted-foreground ml-1 flex items-center"><CalendarDays className="h-4 w-4 inline-block mr-1" />{formatDate(article.updatedAt.toString())}</span>
            </div>

            {/* 统计信息 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{article.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{article.commentsCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{article.views || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}