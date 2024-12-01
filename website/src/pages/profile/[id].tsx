'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/auth-context'
import { useToast } from '@/hooks/use-toast'
import type { User } from '@/types/user'
import { getUserProfile } from '@/api/user'
import { getCasesByUserId, getStarCasesByUserId } from '@/api/case'
import { getArticlesByUserId } from '@/api/article'
import { Skeleton } from '@/components/ui/skeleton'
import type { CaseItem, CaseArticle } from '@/types/case'
import { ArticleCard } from '@/components/article/ArticleCard'
import { CaseCard } from '@/components/case/CaseCard'
import { toggleStarCase } from '@/api/case'
import { useRouter } from 'next/router'
import { CardPanel } from '@/components/ui/card-panel'
import { CustomPagination } from '@/components/ui/custom-pagination'
import { ProfileCard } from '@/components/profile/ProfileCard'

export default function ProfilePage() {
  const params = useParams()
  const userId = params?.id as string  // 确保有 id
  const { user: currentUser, updateUser } = useAuth()
  const { toast } = useToast()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [articles, setArticles] = useState<CaseArticle[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [activeTab, setActiveTab] = useState('articles')
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [starCases, setStarCases] = useState<CaseItem[]>([])
  const router = useRouter()
  const [pagination, setPagination] = useState({
    articles: { current: 1, pageSize: 10, total: 0 },
    cases: { current: 1, pageSize: 10, total: 0 },
    starCases: { current: 1, pageSize: 10, total: 0 }
  })
  const [isPageLoading, setIsPageLoading] = useState(true)

  // 判断是否是当前用户的个人页
  const isCurrentUser = currentUser?._id === userId

  useEffect(() => {
    const initializeProfile = async () => {
      if (!userId) return

      setIsPageLoading(true)
      try {
        // 1. 先加载用户信息
        if (isCurrentUser && currentUser) {
          setProfileUser(currentUser as User)
        } else {
          const { data } = await getUserProfile(userId)
          setProfileUser(data.data)
        }

        // 2. 并行加载所有 tab 的第一页数据
        await Promise.all([
          loadTabContent('articles', 1, false), // 文章
          loadTabContent('cases', 1, false),    // 案例
          isCurrentUser ? loadTabContent('projects', 1, false) : Promise.resolve() // 收藏案例（仅当前用户）
        ])

        // 3. 加载当前激活 tab 的内容（如果需要）
        if (activeTab !== 'articles') {
          await loadTabContent(activeTab)
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: '加载失败',
          description: error instanceof Error ? error.message : '请稍后重试'
        })
      } finally {
        setIsPageLoading(false)
      }
    }

    initializeProfile()
  }, [userId, currentUser, isCurrentUser])

  const loadTabContent = async (tab: string, page?: number, setLoading: boolean = true) => {
    if (!userId) return

    if (setLoading) {
      setIsLoadingContent(true)
    }

    try {
      const pageSize = 10
      switch (tab) {
        case 'articles':
          const articlesData = await getArticlesByUserId(userId, {
            current: page || pagination.articles.current,
            pageSize,
            sortField: 'updatedAt',
            sortOrder: 'descend'
          })
          setArticles(articlesData.items || [])
          setPagination(prev => ({
            ...prev,
            articles: {
              ...prev.articles,
              current: page || prev.articles.current,
              total: articlesData.total
            }
          }))
          break

        case 'cases':
          const casesData = await getCasesByUserId(userId, {
            current: page || pagination.cases.current,
            pageSize
          })
          setCases(casesData.items || casesData.data || [])
          setPagination(prev => ({
            ...prev,
            cases: {
              ...prev.cases,
              current: page || prev.cases.current,
              total: casesData.total
            }
          }))
          break

        case 'projects':
          if (isCurrentUser) {
            const starCasesData = await getStarCasesByUserId(userId, {
              current: page || pagination.starCases.current,
              pageSize
            })
            setStarCases(starCasesData.data || [])
            setPagination(prev => ({
              ...prev,
              starCases: {
                ...prev.starCases,
                current: page || prev.starCases.current,
                total: starCasesData.total
              }
            }))
          }
          break
      }
    } catch (error) {
      toast({
        title: '加载失败',
        description: String(error),
        variant: 'destructive'
      })
    } finally {
      if (setLoading) {
        setIsLoadingContent(false)
      }
    }
  }

  const handleCaseStar = async (caseId: string) => {
    try {
      // 先乐观更新UI
      if (activeTab === 'cases') {
        setCases(prev => prev.map(c =>
          c._id === caseId ? { ...c, isStarred: !c.isStarred } : c
        ));
      } else if (activeTab === 'projects') {
        // 如果在收藏列表中，直接从列表中移除
        setStarCases(prev => prev.filter(c => c._id !== caseId));
        setPagination(prev => ({
          ...prev,
          starCases: {
            ...prev.starCases,
            total: Math.max(0, prev.starCases.total - 1)
          }
        }));
      }

      const response = await toggleStarCase(caseId)

      toast({
        title: '操作成功',
        description: response.isStarred ? '已收藏案例' : '已取消收藏',
        variant: 'default'
      });
    } catch (error) {
      // 发生错误时回滚UI
      loadTabContent(activeTab);
      toast({
        title: '操作失败',
        description: String(error),
        variant: 'destructive'
      });
    }
  }

  // 添加一个生成骨架屏的工具函数
  const generateSkeletons = (count: number = 3) => {
    // 使用当前页码和页大小来计算应该显示多少个骨架屏
    return Array.from({ length: count }, (_, i) => (
      <div key={i} className="space-y-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" /> {/* 标题 */}
          <Skeleton className="h-3 w-1/2" /> {/* 描述 */}
          <div className="flex items-center gap-4 mt-2">
            <Skeleton className="h-6 w-6 rounded-full" /> {/* 头像 */}
            <Skeleton className="h-3 w-24" /> {/* 用户名 */}
            <Skeleton className="h-3 w-32" /> {/* 日期 */}
          </div>
        </div>
      </div>
    ))
  }

  // 修改tabs的定义，将content集成到tabs配置中
  const tabs = [
    {
      value: 'articles',
      label: `文章 (${pagination.articles.total})`,
      content: (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="p-4 space-y-4">
              {isLoadingContent ? (
                <div className="space-y-6">
                  {generateSkeletons(pagination.articles.pageSize)} {/* 使用页大小作为骨架屏数量 */}
                </div>
              ) : articles.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <ArticleCard
                        key={article._id}
                        article={article}
                        onClick={() => router.push(`/case/${(article.caseId as CaseItem)._id}?tab=articles&articleId=${article._id}`)}
                      />
                    ))}
                  </div>
                  <CustomPagination
                    current={pagination.articles.current}
                    pageSize={pagination.articles.pageSize}
                    total={pagination.articles.total}
                    onChange={(page) => loadTabContent('articles', page)}
                  />
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  暂无发布的文章
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      value: 'cases',
      label: `案例 (${pagination.cases.total})`,
      content: (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="p-4 space-y-4">
              {isLoadingContent ? (
                <div className="space-y-6">
                  {generateSkeletons(pagination.cases.pageSize)}
                </div>
              ) : cases.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {cases.map((caseItem) => (
                      <CaseCard
                        key={caseItem._id}
                        isStarred={caseItem.isStarred || currentUser?.starIds?.includes(caseItem._id)}
                        {...caseItem}
                        onStarClick={() => handleCaseStar(caseItem._id)}
                      />
                    ))}
                  </div>
                  <CustomPagination
                    current={pagination.cases.current}
                    pageSize={pagination.cases.pageSize}
                    total={pagination.cases.total}
                    onChange={(page) => loadTabContent('cases', page)}
                  />
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  暂无发布的案例
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    ...(isCurrentUser ? [{
      value: 'projects',
      label: `收藏案例 (${pagination.starCases.total})`,
      content: (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="p-4 space-y-4">
              {isLoadingContent ? (
                <div className="space-y-6">
                  {generateSkeletons(pagination.starCases.pageSize)}
                </div>
              ) : starCases.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {starCases.map((caseItem) => (
                      <CaseCard
                        key={caseItem._id}
                        isStarred={true}
                        onStarClick={() => handleCaseStar(caseItem._id)}
                        {...caseItem}
                      />
                    ))}
                  </div>
                  <CustomPagination
                    current={pagination.starCases.current}
                    pageSize={pagination.starCases.pageSize}
                    total={pagination.starCases.total}
                    onChange={(page) => loadTabContent('projects', page)}
                  />
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  暂无收藏的案例
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }] : [])
  ]

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 处理用户信息更新
  const handleProfileUpdate = (updatedUser: User) => {
    setProfileUser(updatedUser)
    // 如果是当前用户，同时更新全局用户状态
    if (isCurrentUser) {
      updateUser(updatedUser)
    }
  }

  if (!isMounted) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-6">
            <div className="space-y-6">
              <Skeleton className="h-[200px] w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[calc(100vh-theme(spacing.32))] w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-6">
          {isPageLoading ? (
            <div className="space-y-6">
              {generateSkeletons(1)}
            </div>
          ) : (
            profileUser && (
              <ProfileCard
                user={profileUser}
                isCurrentUser={isCurrentUser}
                onProfileUpdate={handleProfileUpdate}
                className="p-2 w-full"
              />
            )
          )}
        </div>

        {/* Right Content */}
        <div className="space-y-4">
          <CardPanel
            className="h-[calc(100vh-theme(spacing.32))]"
            header={{
              tabs,
              defaultValue: 'articles',
              value: activeTab,
              onValueChange: setActiveTab
            }}
          />
        </div>
      </div>
    </div>
  )
}