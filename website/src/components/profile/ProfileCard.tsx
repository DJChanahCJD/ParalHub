import { User } from '@/types/user'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, LinkIcon, Mail, Smile, Loader2, ChevronLeft } from 'lucide-react'
import { AvatarUpload } from './AvatarUpload'
import { useToast } from '@/hooks/use-toast'
import { updateProfile } from '@/api/user'
import { changeAvatar } from '@/api/upload'
import { RoleBadge } from './RoleBadge'
import { UserList } from './UserList'
import { followUser, unfollowUser, checkFollowing } from '@/api/follow'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/auth-context'

interface ProfileCardProps {
  user: User
  isCurrentUser: boolean
  onProfileUpdate: (updatedUser: User) => void  // 更新用户信息的回调
  className?: string
}

export function ProfileCard({ user, isCurrentUser, onProfileUpdate, className }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showUserList, setShowUserList] = useState<'following' | 'followers' | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [search, setSearch] = useState('')
  const { user: currentUser, refreshUser } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const checkIsFollowing = async () => {
      try {
        const response = await checkFollowing(user._id)
        setIsFollowing(response.data)
      } catch {
        setIsFollowing(false)
      }
    }
    checkIsFollowing()
  }, [user._id])

  // 处理头像更新
  const handleAvatarChange = async (file: File) => {
    if (!file) return

    try {
      setIsUploading(true)
      const avatarUrl = await changeAvatar(user._id, file)

      // 直接更新状态，不需要刷新页面
      onProfileUpdate({ ...user, avatar: avatarUrl })

      toast({
        title: "成功",
        description: "头像已更新"
      })
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        variant: "destructive",
        title: "上传失败",
        description: error instanceof Error ? error.message : "请稍后重试"
      })
    } finally {
      setIsUploading(false)
    }
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const updatedData: Partial<User> = {
      username: formData.get('username') as string,
      bio: formData.get('bio') as string,
      company: formData.get('company') as string,
      location: formData.get('location') as string,
      website: formData.get('website') as string
    }

    try {
      const response = await updateProfile(user._id, updatedData)
      console.log("response from updateProfile", response)
      onProfileUpdate(response.data) // 修复: 从 axios 响应中获取 data
      setIsEditing(false)
      toast({
        title: "成功",
        description: "个人资料已更新"
      })
    } catch (error) {
      console.error('Update profile error:', error)
      toast({
        variant: "destructive",
        title: "更新失败",
        description: error instanceof Error ? error.message : "请稍后重试"
      })
    }
  }

  // 处理关注/取消关注
  const handleFollowClick = async () => {
    try {
      setIsFollowLoading(true)
      if (isFollowing) {
        await unfollowUser(user._id, user.role)
      } else {
        await followUser(user._id, user.role)
      }
      setIsFollowing(!isFollowing)
      onProfileUpdate({
        ...user,
        followerCount: (user.followerCount || 0) + (isFollowing ? -1 : 1),
      })
      if (currentUser) {
        currentUser.followingCount = (currentUser.followingCount || 0) + (isFollowing ? -1 : 1)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "操作失败",
        description: error instanceof Error ? error.message + "\n请先登录" : "请稍后重试"
      })
    } finally {
      setIsFollowLoading(false)
    }
  }

  const renderInfoItems = () => {
    const items = [
      { icon: Mail, value: user.email },
      { icon: Smile, value: user.bio },
      { icon: Building2, value: user.company },
      {
        icon: LinkIcon,
        value: user.website,
        render: renderWebsiteLink
      }
    ]

    return items.map(({ icon: Icon, value, render }, index) => {
      if (!value) return null
      return (
        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span>{render ? render(value) : value}</span>
        </div>
      )
    })
  }

  const handleFollowChange = () => {
    refreshUser()
  }

  const renderWebsiteLink = (value: string) => {
    try {
      // 验证 URL 格式
      const url = new URL(value);

      // 只允许 http 和 https 协议
      if (!['http:', 'https:'].includes(url.protocol)) {
        return value;
      }

      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline inline-flex items-center gap-1"
          onClick={(e) => {
            // 可选：添加确认提示
            if (!window.confirm('您即将访问外部网站，是否继续？')) {
              e.preventDefault();
            }
          }}
        >
          {value}
          <LinkIcon className="h-3 w-3" />
        </a>
      );
    } catch {
      // URL 格式无效时只显示文本
      return value;
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  if (showUserList) {
    return (
      <Card className={cn(className, "h-[600px]")}>
        <CardContent className="h-full flex flex-col p-0">
          {/* 顶部固定区域 */}
          <div className="flex items-center gap-3 p-4 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserList(null)}
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Input
              placeholder="搜索用户..."
              value={search}
              onChange={handleSearch}
              className="flex-1"
            />
          </div>

          {/* 可滚动的列表区域 */}
          <div className="flex-1 overflow-y-auto w-full">
            <UserList
              userId={user._id}
              type={showUserList}
              onFollowChange={handleFollowChange}
              search={search}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardContent className="pt-6 h-full flex flex-col">
        <div className="text-center mb-2">
          <AvatarUpload
            currentAvatar={user.avatar}
            username={user.username}
            disabled={!isCurrentUser || isUploading}
            onAvatarChange={handleAvatarChange}
          />
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'username', label: '用户名', type: 'input', placeholder: '请输入用户名' },
              { name: 'bio', label: '简介', type: 'textarea', placeholder: '请输入简介' },
              { name: 'company', label: '公司', type: 'input', placeholder: '请输入公司' },
              { name: 'website', label: '网站', type: 'input', placeholder: '请输入网站(http://或https://)' }
            ].map(field => (
              <div key={field.name} className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                {field.type === 'textarea' ? (
                  <Textarea
                    name={field.name}
                    defaultValue={user[field.name as keyof User] as string}
                    rows={3}
                  />
                ) : (
                  <Input
                    name={field.name}
                    defaultValue={user[field.name as keyof User] as string}
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2">
              <Button type="submit">保存</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                取消
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mt-4 text-2xl font-bold">
                {user.username || user.realName}
              </h2>
              <div className="mt-2">
                <RoleBadge
                  role={
                    user.role === 'enterprise'
                      ? (user.verificationStatus === 'verified' ? 'enterprise' : 'unverified')
                      : user.role
                  }
                />
              </div>

              <div className="mt-4 flex justify-center gap-8">
                <button
                  onClick={() => setShowUserList('following')}
                  className={cn(
                    "text-sm text-muted-foreground hover:text-foreground",
                    (isCurrentUser) && "cursor-pointer"
                  )}
                  disabled={!isCurrentUser}
                >
                  <div className="font-medium">{user.followingCount || 0}</div>
                  <div>关注</div>
                </button>
                <button
                  onClick={() => setShowUserList('followers')}
                  className={cn(
                    "text-sm text-muted-foreground hover:text-foreground",
                    (isCurrentUser) && "cursor-pointer"
                  )}
                  disabled={!isCurrentUser}
                >
                  <div className="font-medium">{user.followerCount || 0}</div>
                  <div>粉丝</div>
                </button>
              </div>
            </div>

            {isCurrentUser ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsEditing(true)}
              >
                编辑个人资料
              </Button>
            ) : (
              <Button
                className="w-full"
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowClick}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isFollowing ? "已关注" : "关注"
                )}
              </Button>
            )}

            <div className="space-y-3">
              {renderInfoItems()}
            </div>

            {user.skills && user.skills?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">技能标签</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill: string) => (
                    <Badge key={skill}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}