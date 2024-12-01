import { User } from '@/types/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RoleBadge } from './RoleBadge'
import { useState } from 'react'
import { followUser, unfollowUser } from '@/api/follow'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/router'

interface UserCardProps {
  user: User
  isFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export function UserCard({ user, isFollowing: initialIsFollowing, onFollowChange }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      setIsLoading(true)
      if (isFollowing) {
        await unfollowUser(user._id, user.role)
      } else {
        await followUser(user._id, user.role)
      }
      setIsFollowing(!isFollowing)
      onFollowChange?.(!isFollowing)
    } catch (error) {
      toast({
        variant: "destructive",
        title: '操作失败',
        description: error instanceof Error ? error.message : '请稍候重试'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="transition-all duration-200 self-center w-full hover:bg-accent/5 hover:shadow-sm">
      <CardContent className="p-3 flex items-center gap-3">
        <Avatar className="cursor-pointer" onClick={() => navigateToProfile(user._id)}>
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback className="bg-primary/5 text-primary/80">
            {user.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate text-base">
              {user.username}
            </span>

          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <RoleBadge role={user.role} />
          </div>
        </div>

        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleFollowClick}
          disabled={isLoading}
          className={`min-w-[4rem] transition-colors ${
            isFollowing
              ? 'hover:bg-destructive hover:text-destructive-foreground'
              : 'hover:bg-primary/90'
          }`}
        >
          {isLoading ? '...' : isFollowing ? '已关注' : '关注'}
        </Button>
      </CardContent>
    </Card>
  )
}