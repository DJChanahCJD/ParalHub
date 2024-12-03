import { CaseArticle } from '@/types/case'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Eye, MessageSquare, ThumbsUp, MoreVertical, Edit, Trash2, ShieldCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/auth-context'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteArticle } from '@/api/article'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ArticleCardProps {
  article: CaseArticle
  className?: string
  onClick?: () => void
  isSelected?: boolean
  caseId?: string
  isCaseAuthor?: boolean
}

export function ArticleCard({ article, className, onClick, isSelected, caseId, isCaseAuthor }: ArticleCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const router = useRouter()

  // 判断是否为作者
  const isAuthor = user?._id === article.authorId?._id

  // 编辑文章
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/article/${article._id}/edit`)
  }

  // 删除文章
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await deleteArticle(article._id as string)
      toast({
        title: '删除成功',
        description: '文章已成功删除',
      })
      router.refresh()
    } catch (error) {
      toast({
        title: '删除失败',
        description: String(error),
        variant: 'destructive',
      })
    }
  }

  // 从文章内容中提取标题和预览
  const lines = article.content?.split('\n') || []
  const title = article.title
  const preview = lines?.[1]?.slice(0, Math.min(64, lines?.[1]?.length)) || ''

  // 如果没有提供 onClick，则使用默认的链接处理
  const handleClick = onClick || (() => {
    if (caseId && article._id) {
      window.location.href = `/case/${caseId}/article/${article._id}`
    }
  })

  // 修改删除按钮的处理函数
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteAlert(true);
  };

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
          {/* 标题和标签行 */}
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {title}
            </CardTitle>

            {/* 操作按钮 */}
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">打开菜单</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {article.tags?.map((tag) => (
              <Badge
                key={tag}
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
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
                  {article.authorId?.username?.charAt(0).toUpperCase() || '注'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {article.authorId?.username || '注销用户'}
              </span>
              <span className="text-sm text-muted-foreground ml-1 flex items-center">
                <CalendarDays className="h-4 w-4 inline-block mr-1" />
                {formatDate(article.updatedAt.toString())}
              </span>
              {isCaseAuthor && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded inline-flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  官方
                </span>
              )}
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

      {/* 删除确认对话框 */}
      <AlertDialog
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，确定要删除这篇文章吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.stopPropagation();
              handleDelete(e);
            }}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}