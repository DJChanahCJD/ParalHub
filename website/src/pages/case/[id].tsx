'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import { getCaseDetail} from '@/api/case'
import { CaseArticle, CaseItem } from '@/types/case'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, Share2, Star, ThumbsUp, Eye, Clock, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import MDEditor from '@uiw/react-md-editor'
import { ArticleCard } from '@/components/article/ArticleCard'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import '@uiw/react-markdown-preview/markdown.css';
import '@uiw/react-md-editor/markdown-editor.css';
import rehypePrism from 'rehype-prism-plus';
import { CardPanel, CardPanelGroup } from '@/components/ui/card-panel'
import { useStar } from '@/hooks/use-star'
import { useAuth } from '@/hooks/auth-context'
import { createCaseArticle, getCaseArticles, viewCaseArticle, getCaseArticleDetail } from '@/api/article'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getTags } from '@/api/common'
import { Tag } from '@/types/common'
import { MultiSelect } from "@/components/ui/multi-select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Loader2 } from "lucide-react"
import Head from 'next/head'
import { ArticleMeta } from '@/components/article/ArticleMeta'
import { Skeleton } from '@/components/ui/skeleton'
import { useDelayedLoading } from '@/hooks/use-delayed-loading'
import { useLike } from '@/hooks/use-like'
import CommentSection from '@/components/comment/CommentSection'
import { useInView } from 'react-intersection-observer'
import { MarkdownEditor } from '@/components/editor/MarkdownEditor'

// 定义表单验证模式
const articleSchema = z.object({
  title: z.string().max(64, "标题不能超过64个字符"),
  content: z.string().min(1, "文章内容不能为空"),
  description: z.string().max(256, "概述不能超过256个字符").optional(),
  tags: z.array(z.string()).optional(),
  updatedAt: z.string().optional(),
})

type ArticleFormData = z.infer<typeof articleSchema>

// 添加排序类型定义
type SortField = 'updatedAt' | 'views' | 'likes';
type SortOrder = 'desc' | 'asc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export default function CasePage() {
  const router = useRouter()
  const { id } = router.query
  const { toast } = useToast()
  const { handleStar, isStarred } = useStar()
  const { user } = useAuth()
  const { startLoading } = useDelayedLoading()
  const [caseDetail, setCaseDetail] = useState<CaseItem>()
  const [articles, setArticles] = useState<CaseArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [leftExpanded, setLeftExpanded] = useState(false)
  const [rightExpanded, setRightExpanded] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedArticle, setSelectedArticle] = useState<CaseArticle | null>(null)
  const [activeTab, setActiveTab] = useState<string>('description')
  const [isArticleLoading, setIsArticleLoading] = useState(false)
  const { handleLike, isLiked } = useLike()
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: '100px',
  })

  // 使用 React Hook Form 进行表单管理
  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: [],
    }
  })

  // 草稿保存功能
  const [draftKey] = useState(`article-draft-${id}`)
  const { value: draft, setValue: setDraft } = useLocalStorage<ArticleFormData>(draftKey, null)

  // 在组件内添加状态
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'updatedAt',
    order: 'desc'
  });

  // 添加排序选项配置
  const sortOptions = [
    { value: 'updatedAt', label: '时间', icon: Clock },
    { value: 'views', label: '浏览', icon: Eye },
    { value: 'likes', label: '热度', icon: Flame },
  ] as const;

  // 监听 URL 参数变化
  useEffect(() => {
    const tab = router.query.tab as string
    const articleId = router.query.articleId as string

    if (tab) {
      setActiveTab(tab)
    } else {
      setActiveTab('description')
    }

    if (articleId) {
      // 总是从服务器获取最新的文章详情
      loadArticleDetail(articleId)
    } else {
      setSelectedArticle(null)
    }
  }, [router.query])

  // 恢复草稿
  useEffect(() => {
    if (draft) {
      form.reset(draft)
    }
  }, [])

  // 加载案例详情和标签
  useEffect(() => {
    if (id) {
      startLoading(async () => {
        await Promise.all([
          loadCaseDetail(),
          loadAvailableTags(),
          loadArticles()
        ]).finally(() => {
          setIsLoading(false)
        })
      })
    }
  }, [id, startLoading])

  // 监听滚动到底部
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore && activeTab === 'articles' && !selectedArticle && articles.length > 0) {
      // 添加延迟避免频繁触发
      const timer = setTimeout(() => {
        const nextPage = currentPage + 1
        loadArticles(nextPage, false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [inView, hasMore, isLoadingMore, activeTab, selectedArticle, articles.length])

  // 监听排序配置变化
  useEffect(() => {
    if (id) {
      loadArticles(1, true);
    }
  }, [sortConfig, id]);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/case/${id}`)
    toast({
      title: '已复制链接',
      description: '已将链接复制到剪贴板',
      variant: 'default',
      className: 'bg-primary text-primary-foreground',
    })
  }

  const handleLikeArticle = async (articleId: string) => {
    if (!selectedArticle || !user) {
      toast({
        title: "请先登录",
        description: "登录后即可点赞文章",
        variant: "destructive",
      })
      return
    }

    const currentIsLiked = isLiked(articleId)
    const delta = currentIsLiked ? -1 : 1
    try {
      await handleLike(id as string, articleId)
    } catch (error) {
      toast({
        title: '点赞失败',
        description: String(error),
        variant: 'destructive',
      })
      return;
    }
    setSelectedArticle(prev => prev?._id === articleId ? { ...prev, likes: Math.max(prev.likes + delta, 0) } : prev)
  }

  const loadAvailableTags = async () => {
    try {
      const data = await getTags()
      setAvailableTags(data.data)
    } catch (error) {
      toast({
        title: '加载失败',
        description: '无法加载可用标签\n' + error,
        variant: 'destructive',
      })
    }
  }

  const loadCaseDetail = async () => {
    try {
      const detail = await getCaseDetail(id as string)
      setCaseDetail(detail)
    } catch (error) {
      toast({
        title: '加载失败',
        description: '无法加载案例详情\n' + error,
        variant: 'destructive',
      })
    }
  }

  const loadArticles = async (page: number = 1, reset: boolean = false, title: string = '') => {
    if (!id || isLoadingMore) return

    try {
      setIsLoadingMore(true)
      const response = await getCaseArticles(id as string, {
        current: page,
        pageSize: 10,
        sortField: sortConfig.field,
        sortOrder: sortConfig.order === 'desc' ? 'descend' : 'ascend',
        title
      })

      console.log("response from loadArticles", response)

      const total = response.total || 0
      const hasMoreItems = page * 10 < total
      const data = response.items
      if (reset || page === 1) {
        setArticles(data || [])
      } else {
        const newArticles = data?.filter(
          (newArticle: CaseArticle) => !articles.some(
            (existingArticle: CaseArticle) => existingArticle._id === newArticle._id
          )
        )
        if (newArticles && newArticles.length > 0) {
          setArticles(prev => [...prev, ...newArticles])
        }
      }

      setHasMore(hasMoreItems)
      setCurrentPage(page)
    } catch (error) {
      toast({
        title: "加载失败",
        description: '无法加载文章列表\n' + error,
        variant: 'destructive',
      })
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleSearch = (title: string) => {
    console.log("searchQuery", title)
    setSearchQuery(title)
    loadArticles(1, true, title)
  }

  // 修改文章列表区域的搜索和排序UI
  const renderArticleList = () => (
    <div className="px-4 space-y-4">
      {/* 初始加载状态 */}
      {isLoading && articles.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      )}

      {/* 文章列表 */}
      {articles.map((article) => (
        <ArticleCard
          key={article._id}
          article={article}
          onClick={() => handleArticleClick(article._id)}
          className="cursor-pointer transition-colors hover:bg-muted/50"
        />
      ))}

      {/* 加载更多指示器 */}
      {hasMore && !isLoading && (
        <div
          ref={loadMoreRef}
          className="flex justify-center py-4"
        >
          {isLoadingMore ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <span className="text-sm text-muted-foreground">
              向下滚动加载更多
            </span>
          )}
        </div>
      )}

      {/* 没有更多数据提示 */}
      {!hasMore && articles.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          没有更多文章了
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && !isLoadingMore && articles.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">暂无相关文章</p>
        </div>
      )}
    </div>
  )

  // 处理标签页切换
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)

    const query: { [key: string]: string } = { ...router.query } as { [key: string]: string }

    if (value === 'description') {
      delete query.tab
      delete query.articleId
    } else {
      query.tab = value
      if (value !== 'articles' && selectedArticle) {
        delete query.articleId
      }
    }

    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true })
  }, [router, selectedArticle, articles.length])

  // 修改处理文章点击的函数
  const handleArticleClick = async (articleId: string) => {
    try {
      setIsArticleLoading(true)

      const article = await getCaseArticleDetail(id as string, articleId)
      if (article) {
        article.views = article.views + 1
        setSelectedArticle(article)
      }

      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          tab: 'articles',
          articleId
        }
      }, undefined, { shallow: true })

      // 更新浏览量
      await viewCaseArticle(id as string, articleId)
    } catch (error) {
      toast({
        title: '加载失败',
        description: '无法加载文章详情\n' + error,
        variant: 'destructive',
      })
    } finally {
      setIsArticleLoading(false)
    }
  }

  // 返回文章列表
  const handleBackToList = useCallback(() => {
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab: 'articles',
        articleId: undefined
      }
    }, undefined, { shallow: true })
    setSelectedArticle(null)
    loadArticles(1, true)
  }, [router])

  const handlePublish = async (data: ArticleFormData) => {
    if (!user) {
      toast({
        title: '请先登录',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsPublishing(true)
      await createCaseArticle(id as string, {
        ...data,
        tags: selectedTags || []
      })

      // 清除草稿
      setDraft(null)
      setSelectedTags([])
      form.reset()

      router.reload()
      toast({
        title: '发布成功',
        description: '您的文章已成功发布',
      })
    } catch (error) {
      toast({
        title: '发布失败',
        description: '请稍后重试\n' + error,
        variant: 'destructive',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // 添加评论区引用
  const commentSectionRef = useRef<HTMLDivElement>(null)

  // 修改评论按钮点击处理函数
  const handleCommentClick = useCallback(() => {
    commentSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }, [])

  // 添加手动保存草稿的方法
  const handleSaveDraft = () => {
    const values = form.getValues()
    console.log("values", values)
    if (!values.content && !values.title && !values.tags?.length) {
      toast({
        title: '保存失败',
        description: '内容不能为空',
        variant: 'destructive',
      })
      return
    }

    setDraft({
      ...values,
      updatedAt: new Date().toISOString()
    })

    toast({
      title: '保存成功',
      description: '草稿已保存（7天内有效）',
      className: 'bg-primary text-primary-foreground',
    })
  }

  // 添加加载单个文章详情的函数
  const loadArticleDetail = async (articleId: string) => {
    try {
      setIsArticleLoading(true)
      const article = await getCaseArticleDetail(id as string, articleId)
      console.log("article", article)
      setSelectedArticle(article)
    } catch (error) {
      toast({
        title: '加载失败',
        description: '无法加载文章详情\n' + error,
        variant: 'destructive',
      })
    } finally {
      setIsArticleLoading(false)
    }
  }

  // 添加更新评论数的函数
  const handleCommentCountChange = useCallback((count: number) => {
    // 更新选中文章的评论数
    if (selectedArticle) {
      setSelectedArticle(prev => prev ? { ...prev, commentsCount: count } : prev)
    }

    // 同时更新文章列表中的评论数
    setArticles(prev => prev.map(article =>
      article._id === router.query.articleId
        ? { ...article, commentsCount: count }
        : article
    ))
  }, [router.query.articleId])

  // 处理加载状态
  if (!id || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <Skeleton className="w-full h-4" />
        </div>
      </div>
    )
  }

  // 处理数据不存在的情况
  if (!caseDetail) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold">案例不存在</p>
          <Button variant="link" asChild>
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleStarClick = async () => {
    // 乐观更新：立即更新UI
    const currentIsStarred = isStarred(caseDetail._id)
    const starDelta = currentIsStarred ? -1 : 1
    try {
      // 更新案例详情的收藏数
      setCaseDetail(prev => prev ? {
        ...prev,
        stars: (prev.stars || 0) + starDelta
      } : prev)

      // 发送请求到服务器
      await handleStar(caseDetail._id)
    } catch (error) {
      // 如果失败，回滚UI更新
      setCaseDetail(prev => prev ? {
        ...prev,
        stars: (prev.stars || 0) - starDelta
      } : prev)

      toast({
        title: '收藏失败',
        description: String(error),
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <Head>
        <title>{caseDetail.title} - ParalHub</title>
      </Head>
      <div className="h-[calc(100vh-64px)] p-4">
        <CardPanelGroup
          className="h-full"
          defaultLayout={[33.33, 66.67]} // 1:2 比例
        >
          {/* 左侧面板 */}
          <CardPanel
          className="h-full"
          header={{
            tabs: [
              {
                value: "description",
                label: "案例详情",
                content: (
                  <>
                    <div className="flex-none px-6 py-4 border-b">
                      <ArticleMeta
                        title={caseDetail.title}
                        tags={caseDetail.tags}
                        author={caseDetail.authorId}
                        updatedAt={caseDetail.updatedAt}
                        size="sm"
                      />
                    </div>
                    <div className="px-6 py-4 min-h-[50vh]">
                      <MDEditor.Markdown
                        source={caseDetail.content}
                        className={cn(
                          "prose prose-sm dark:prose-invert max-w-none",
                          "[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:pb-2 [&_h1]:border-b",
                          "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold",
                          "[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium",
                          "[&_p]:my-3 [&_p]:leading-relaxed",
                          "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
                          "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
                          "[&_li]:my-2",
                          "[&_code]:text-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded",
                          "[&_pre]:my-4 [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto",
                          "[&_hr]:my-6 [&_hr]:border-border",
                          "[&_blockquote]:my-4 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:text-muted-foreground",
                          "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse",
                          "[&_th]:border [&_th]:border-border [&_th]:px-4 [&_th]:py-2 [&_th]:bg-muted",
                          "[&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2",
                        )}
                        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypePrism]}
                        remarkPlugins={[remarkGfm]}
                      />
                    </div>
                  </>
                ),
                footer: (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-1", isStarred(caseDetail._id) && "text-primary")}
                        onClick={handleStarClick}
                      >
                        <Star className={cn("h-4 w-4", isStarred(caseDetail._id) && "fill-primary")} />
                        {caseDetail.stars}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => setActiveTab('articles')}
                      >
                        <MessageSquare className="h-4 w-4" />
                        {articles.length}
                      </Button>

                    </div>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                      分享
                    </Button>
                  </div>
                )
              },
              {
                value: "articles",
                label: `相关文章`,
                content: selectedArticle ? (
                  <div className="flex flex-col h-full overflow-auto">
                    {/* 头部信息 - 更紧凑的样式 */}
                    <div className="px-4 py-3 border-b shrink-0"> {/* 减小内边距 */}
                      <div className="flex items-center gap-2 mb-3"> {/* 添加 flex 布局，减小间距 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBackToList}
                          className="h-8 px-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span className="ml-1">返回</span> {/* 简化文字 */}
                        </Button>
                      </div>
                      <ArticleMeta
                        title={selectedArticle.title}
                        tags={selectedArticle.tags}
                        author={selectedArticle.authorId}
                        updatedAt={selectedArticle.updatedAt}
                        size="sm"
                      />
                    </div>

                    {/* 文章内容和评论区域 */}
                    <div className="flex-1 overflow-auto">
                      {isArticleLoading ? (
                        <div className="px-6 py-4 space-y-4">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ) : (
                        <div className="px-6 py-4 min-h-[50vh]">
                          <MDEditor.Markdown
                            source={selectedArticle.content}
                            rehypePlugins={[rehypeRaw, rehypeHighlight, rehypePrism]}
                            remarkPlugins={[remarkGfm]}
                            className={cn(
                              "prose prose-sm dark:prose-invert max-w-none",
                              // ... Markdown 样式
                            )}
                          />
                        </div>
                      )}

                      {/* 评论区域 */}
                      <div ref={commentSectionRef} className="border-t">
                        <CommentSection
                          articleId={selectedArticle._id}
                          onCommentChange={handleCommentCountChange}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* 搜索栏 - 更紧凑的样式 */}
                    <div className="px-4 py-2 border-b shrink-0 mb-2">
                      <div className="flex gap-2">
                        <Input
                          type="search"
                          placeholder="搜索文章..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="flex-1 h-8 text-sm"
                        />
                        <div className="flex items-center border rounded-md divide-x bg-muted/5">
                          {sortOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <button
                                key={option.value}
                                className={cn(
                                  "h-8 px-3 flex items-center gap-1.5 text-sm transition-colors hover:bg-muted/50",
                                  sortConfig.field === option.value && "text-primary"
                                )}
                                onClick={() => {
                                  setSortConfig(prev => {
                                    // 如果点击的是当前排序字段，则切换排序方向
                                    if (prev.field === option.value) {
                                      return {
                                        field: option.value,
                                        order: prev.order === 'desc' ? 'asc' : 'desc'
                                      };
                                    }
                                    // 如果点击的是新字段，则使用默认的降序
                                    return {
                                      field: option.value,
                                      order: 'desc'
                                    };
                                  });
                                }}
                              >
                                <Icon className={cn(
                                  "h-4 w-4",
                                  sortConfig.field === option.value && sortConfig.order === 'desc' && "rotate-180 transform"
                                )} />
                                <span className="text-xs font-medium">{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 文章列表 */}
                    <div className="flex-1 overflow-auto">
                      {isArticleLoading ? (
                        <div className="p-4 space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        renderArticleList()
                      )}
                    </div>
                  </div>
                ),
                footer: selectedArticle ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-1", isLiked(selectedArticle._id) && "text-primary")}
                        onClick={() => handleLikeArticle(selectedArticle._id)}
                      >
                        <ThumbsUp className={cn("h-4 w-4", isLiked(selectedArticle._id) && "fill-primary")} />
                        {selectedArticle.likes || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={handleCommentClick}
                      >
                        <MessageSquare className="h-4 w-4" />
                        {selectedArticle.commentsCount || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4" />
                        分享
                      </Button>
                    </div>
                  </div>
                ) : null,
              },
            ],
            value: activeTab,
            onValueChange: handleTabChange,
            defaultValue: "description",
          }}
          onToggleSize={() => setLeftExpanded(!leftExpanded)}
          isExpanded={leftExpanded}
        />

        {/* 右侧面板 */}
        <CardPanel
          className="h-full"
          header={{
            tabs: [
              {
                value: "editor",
                label: "编辑器",
                content: (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 h-full min-h-0">
                      <div data-color-mode="light" className="h-full">
                        <MarkdownEditor
                          value={form.watch("content")}
                          onChange={(val) => form.setValue("content", val)}
                          error={!!form.formState.errors.content}
                          errorMessage={form.formState.errors.content?.message}
                        />
                      </div>
                    </div>
                  </div>
                )
              },
              {
                value: "meta",
                label: "文章信息",
                content: (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">标题</Label>
                        <Input
                          id="title"
                          {...form.register("title")}
                          className={cn(
                            form.formState.errors.title && "border-red-500"
                          )}
                        />
                        {form.formState.errors.title && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.title.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>标签</Label>
                        <MultiSelect
                          selected={selectedTags}
                          onChange={setSelectedTags}
                          options={availableTags.map(tag => ({
                            _id: tag.name,
                            name: tag.name,
                          }))}
                          placeholder="选择标签（可多选）"
                        />
                      </div>
                    </div>
                    <div className="flex-none p-4 flex justify-between items-center ml-auto">
                      <div className="flex gap-2">
                        {(
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDraft(null)
                              form.reset()
                            }}
                          >
                            清除草稿
                          </Button>
                        )}
                        <Button
                          onClick={form.handleSubmit(handlePublish)}
                        >
                          {isPublishing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              发布中...
                            </>
                          ) : '发布文章'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              }
            ],
            defaultValue: "editor",
            extra: (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isPublishing}
                >
                  保存草稿
                </Button>
              </div>
            )
          }}
          onToggleSize={() => setRightExpanded(!rightExpanded)}
          isExpanded={rightExpanded}
        />
        </CardPanelGroup>
      </div>
    </>
  )
}