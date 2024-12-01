import { useAuth } from './auth-context'
import { useToast } from './use-toast'
import { toggleStarCase } from '@/api/case'

interface UseStarOptions {
  onSuccess?: (stars: number) => void  // 成功后的回调，用于更新UI
}

interface UseStarReturn {
  handleStar: (id: string) => Promise<void>;
  isStarred: (id: string) => boolean;
}

export function useStar(): UseStarReturn {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const handleStar = async (caseId: string, options?: UseStarOptions) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "登录后即可收藏案例",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await toggleStarCase(caseId)

      // 确保 starIds 是数组
      const currentStarIds = user.starIds || []

      // 根据响应更新 starIds
      const newStarIds = response.isStarred
        ? [...currentStarIds, caseId]
        : currentStarIds.filter(id => id !== caseId)

      // 更新用户信息
      await updateUser({
        ...user,
        starIds: newStarIds
      }, { skipApi: true })

      // 调用成功回调
      if (response.data.stars !== undefined) {
        options?.onSuccess?.(response.data.stars)
      }

      toast({
        title: response.isStarred ? "收藏成功" : "已取消收藏",
        variant: "default",
        className: 'bg-primary text-primary-foreground',
      })
    } catch (error) {
      toast({
        title: '操作失败',
        description: `收藏操作失败: ${error}`,
        variant: 'destructive',
      })
    }
  }

  return {
    handleStar,
    isStarred: (caseId: string) => (user?.starIds || []).includes(caseId),
  }
}