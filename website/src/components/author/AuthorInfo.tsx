import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, formatDate } from '@/lib/utils'
import router from 'next/router'

interface Author {
  _id: string
  username: string
  avatar: string
}

interface AuthorInfoProps {
  author: Author
  updatedAt: string | Date
  className?: string
  size?: 'sm' | 'md' // 支持不同尺寸
  showPrefix?: boolean // 是否显示 "Updated" 前缀
}

export function AuthorInfo({
  author,
  updatedAt,
  className,
  size = 'sm',
  showPrefix = true
}: AuthorInfoProps) {
  const avatarSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className={cn(
      "flex items-center gap-2",
      textSize,
      "text-muted-foreground",
      className
    )}>
      <span onClick={() => router.push(`/profile/${author?._id}`)} className="cursor-pointer flex items-center gap-2 hover:text-primary hover:underline">
        <Avatar className={avatarSize}>
          <AvatarImage src={author?.avatar || ''} />
          <AvatarFallback>{author?.username[0].toUpperCase() || '注'}</AvatarFallback>
        </Avatar>
        <span>{author?.username || '注销用户'}</span>
      </span>
      <span>·</span>
      <span>
        {showPrefix && 'Updated '}
        {formatDate(updatedAt.toString())}
      </span>
    </div>
  )
}