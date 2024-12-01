import { Badge } from '@/components/ui/badge'
import { AuthorInfo } from '@/components/author/AuthorInfo'
import { cn } from '@/lib/utils'

interface Author {
  _id: string
  username: string
  avatar: string
}

interface ArticleMetaProps {
  title: string
  tags?: string[]
  author: Author
  updatedAt: string | Date
  className?: string
  titleClassName?: string
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

export function ArticleMeta({
  title,
  tags = [],
  author,
  updatedAt,
  className,
  titleClassName,
  size = 'md',
  showTitle = true,
}: ArticleMetaProps) {
  // 根据size调整样式
  const styles = {
    sm: {
      title: 'text-base',
      badge: 'px-1.5 py-0 text-xs',
      container: 'gap-1.5',
    },
    md: {
      title: 'text-lg',
      badge: 'px-2 py-0.5 text-xs',
      container: 'gap-2',
    },
    lg: {
      title: 'text-xl',
      badge: 'px-2 py-0.5 text-sm',
      container: 'gap-3',
    },
  }

  return (
    <div className={cn("flex flex-col", styles[size].container, className)}>
      {/* 标题行 */}
      {showTitle && (
        <h1 className={cn(
          "font-semibold",
          styles[size].title,
          titleClassName
        )}>
          {title}
        </h1>
      )}

      {/* 标签和作者信息行 */}
      <div className="flex items-center gap-3 text-muted-foreground">
        {/* 标签部分 */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className={cn(
                    styles[size].badge,
                    "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 作者信息部分 */}
        <AuthorInfo
          author={author}
          updatedAt={updatedAt}
          size={size === 'sm' ? 'sm' : 'md'}
          showPrefix={false}
          className="ml-auto"
        />
      </div>
    </div>
  )
}