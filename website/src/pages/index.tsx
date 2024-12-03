'use client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CaseCard } from '@/components/case/CaseCard'
import { CaseFilters } from '@/components/case/CaseFilters'
import { getCaseList } from '@/api/case'
import { CaseItem } from '@/types/case'
import { useToast } from '@/hooks/use-toast'
import { CustomPagination } from "@/components/ui/custom-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { useDelayedLoading } from '@/hooks/use-delayed-loading'
import { LoadingBar } from '@/components/ui/loading-bar'
import { useStar } from '@/hooks/use-star'
import { getNoticeList, Notice } from '@/api/notice'
import { NoticeCard } from '@/components/notice/NoticeCard'

export default function Home() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isHeroVisible, setIsHeroVisible] = useState(!searchParams.get('q'))
  const { handleStar, isStarred } = useStar()
  const [latestNotice, setLatestNotice] = useState<Notice | null>(null)

  // 筛选状态
  const [filters, setFilters] = useState({
    tags: [] as string[],
    sortField: 'updatedAt',
    sortOrder: 'descend' as 'descend' | 'ascend',
    authorType: 'all'
  })

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 案例数据状态
  const [cases, setCases] = useState<CaseItem[]>([])
  const { isLoading, startLoading } = useDelayedLoading()

  // 监听搜索状态变化
  useEffect(() => {
    setIsHeroVisible(!searchParams.get('q'))
    fetchCases()
  }, [searchParams])

  // 获取案例表
  const fetchCases = useCallback(async () => {
    try {
      await startLoading(async () => {
        const res = await getCaseList({
          current: pagination.current,
          pageSize: pagination.pageSize,
          ...(filters.tags.length > 0 && { tags: filters.tags }),
          sortField: filters.sortField,
          sortOrder: filters.sortOrder,
          ...(filters.authorType !== 'all' && { authorType: filters.authorType }),
          ...(searchParams.get('q') && { title: searchParams.get('q') || undefined })
        })

        setCases(res.items || [])
        if (res.total !== pagination.total) {
          setPagination(prev => ({ ...prev, total: res.total }))
        }
      })
    } catch (error) {
      console.error('Failed to fetch cases:', error)
      toast({
        title: "Error",
        description: "Failed to load cases",
        variant: "destructive"
      })
    }
  }, [pagination, filters, searchParams, toast, startLoading])

  async function getLatestNotice() {
    const response = await getNoticeList({
      pageSize: 1,
      sortField: 'updatedAt',
      sortOrder: 'descend',
      status: 'published'
    })
    return response.data[0];
  }
  // 监听筛选和分页变化
  useEffect(() => {
    getLatestNotice().then(setLatestNotice)
  }, [])

  useEffect(() => {
    // 监听变化的数据获取
    fetchCases()
  }, [filters, pagination])

  // 处理筛选变化
  const handleFilterChange = (
    key: keyof typeof filters,
    value: string[] | string
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    // 重置分页
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  // 处理排序变化
  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-')
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortOrder: order as 'ascend' | 'descend'
    }))
    // 重置分页
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  return (
    <>
      <LoadingBar isLoading={isLoading} />
      <div className="min-h-[calc(100vh-4rem)] bg-[hsl(var(--background))] flex flex-col">
        {/* Hero Section - 只在可见时渲染 */}
        {isHeroVisible && (
          <section
            className={`
              text-center relative
              transition-all duration-500 ease-in-out
              py-16
            `}
            style={{
              backgroundImage: `url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0))',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0))',
            }}
          >
            <div className="animate-fade-in">
              <h1 className="text-4xl font-bold mb-4">Welcome to ParalHub</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover and share parallel computing cases
              </p>
              <Button size="lg" asChild>
                <Link href="/case/new">Share Your Case</Link>
              </Button>
            </div>
          </section>
        )}

        {/* Main Content */}
        <div className={`flex-1 container mx-auto px-4 pb-6 ${isHeroVisible ? 'pt-6' : 'pt-8'}`}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
            <section className="space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 bg-card rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </div>
                      <Skeleton className="h-20 w-full" />
                      <div className="flex gap-2">
                        {[1, 2, 3].map((tag) => (
                          <Skeleton key={tag} className="h-6 w-16" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : cases.length > 0 ? (
                <>
                  {cases.map((caseItem) => (
                    <CaseCard
                      key={caseItem._id}
                      {...caseItem}
                      isStarred={isStarred(caseItem._id)}
                      onStarClick={() => handleStar(caseItem._id)}
                    />
                  ))}
                  <CustomPagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={(page) =>
                      setPagination(prev => ({ ...prev, current: page }))
                    }
                  />
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No cases found
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <CaseFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
              />
              {latestNotice && <NoticeCard notice={latestNotice} />}
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}