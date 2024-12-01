import { useAuth } from './auth-context'
import { useToast } from './use-toast'
import { likeCaseArticle } from '@/api/article'

interface UseLikeOptions {
  onSuccess?: (likes: number) => void  // 成功后的回调，用于更新UI
}

export function useLike() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const handleLike = async (caseId: string, articleId: string, options?: UseLikeOptions) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后即可点赞文章",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await likeCaseArticle(caseId, articleId)

      // 确保 likedArticleIds 是数组
      const currentLikedIds = user.likedArticleIds || []

      // 根据响应更新 likedArticleIds
      const newLikedIds = response.isLiked
        ? [...currentLikedIds, articleId]
        : currentLikedIds.filter(id => id !== articleId)

      // 更新用户信息
      await updateUser({
        ...user,
        likedArticleIds: newLikedIds
      }, { skipApi: true })

      console.log("response.data.likes", response.data.likes)
      // 调用成功回调
      if (response.data.likes !== undefined) {
        options?.onSuccess?.(response.data.likes)
      }

      toast({
        title: response.isLiked ? "点赞成功" : "已取消点赞",
        variant: "default",
        className: 'bg-primary text-primary-foreground',
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: `点赞操作失败: ${error}`,
        variant: 'destructive',
      })
    }
  }

  return {
    handleLike,
    isLiked: (articleId: string) => (user?.likedArticleIds || []).includes(articleId),
  }
}