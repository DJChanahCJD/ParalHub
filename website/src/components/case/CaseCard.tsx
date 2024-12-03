import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Star, StarIcon, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { CaseItem } from '@/types/case'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/auth-context'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCase } from '@/api/case'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'

// 定义案例卡片的属性接口
interface CaseCardProps extends CaseItem {
  isStarred?: boolean
  onStarClick?: () => void
}

export function CaseCard({
  _id,
  title,
  description,
  tags,
  stars,
  authorId,
  updatedAt,
  isStarred: initialIsStarred,
  onStarClick
}: CaseCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [localIsStarred, setLocalIsStarred] = useState(initialIsStarred)
  const [localStars, setLocalStars] = useState(stars)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const router = useRouter()

  const handleStarClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后即可收藏案例",
        variant: "destructive",
      })
      return
    }

    setLocalIsStarred(prev => !prev)
    setLocalStars(prev => prev + (localIsStarred ? -1 : 1))
    
    try {
      await onStarClick?.()
    } catch (error) {
      setLocalIsStarred(initialIsStarred)
      setLocalStars(stars)
      console.error(error)
    }
  }

  // 判断是否为作者
  const isAuthor = user?._id === authorId._id

  // 编辑案例
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/case/${_id}/edit`)
  }

  // 删除案例
  const handleDelete = async () => {
    try {
      await deleteCase(_id)
      toast({
        title: '删除成功',
        description: '案例已成功删除',
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

  return (
    <Card className="group hover:border-[hsl(var(--primary)/0.5)] hover:shadow-sm hover:shadow-[hsl(var(--primary)/0.1)] transition-all duration-200">
      <Link href={`/case/${_id}`} target="_blank" className="block">
        <CardHeader className="pb-2">
          {/* 标题行 */}
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold text-foreground/90 hover:text-primary hover:underline">
              {title}
            </CardTitle>
            <button
              onClick={handleStarClick}
              className="mt-0.5 hover:text-primary transition-colors h-fit"
              aria-label={localIsStarred ? "取消收藏" : "收藏"}
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  localIsStarred ? "fill-primary text-primary" : "text-muted-foreground",
                  "hover:text-primary"
                )}
              />
            </button>
          </div>

          {/* 描述 */}
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
            {description}
          </p>
        </CardHeader>

        <CardContent className="pb-4">
          {/* 标签 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs font-medium bg-[hsl(var(--primary)/0.1)]
                          text-[hsl(var(--primary))] rounded-full transition-colors
                          hover:bg-[hsl(var(--primary)/0.15)]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 元信息 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <StarIcon className="w-3.5 h-3.5" />
              <span>{localStars}</span>
            </div>
            <Link
              href={`/profile/${authorId._id}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 hover:underline"
            >
              {authorId.avatar && (
                <Image
                  src={authorId.avatar}
                  alt=""
                  className="w-4 h-4 rounded-full"
                  width={16}
                  height={16}
                />
              )}
              <span>{authorId.username}</span>
            </Link>
            <time className="flex items-center">
              <CalendarDays className="h-4 w-4 inline-block mr-1" />
              {formatDate(updatedAt.toString())}
            </time>
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    title="更多操作"
                    className="h-8 w-8 p-0 flex items-center justify-center ml-auto -mr-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Link>


      {/* 删除确认对话框 */}
      <AlertDialog
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，确定要删除这个案例吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
