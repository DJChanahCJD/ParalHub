'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useToast } from '@/hooks/use-toast'
import { getArticleById, updateArticle } from '@/api/article'
import { ContentEditor } from '@/components/editor/ContentEditor'
import { CaseArticle, CaseItem } from '@/types/case'

export default function EditArticlePage() {
  const router = useRouter()
  const { id } = router.query
  const { toast } = useToast()
  const [articleData, setArticleData] = useState<CaseArticle | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadArticleDetail()
    }
  }, [id])

  const loadArticleDetail = async () => {
    try {
      const data = await getArticleById(id as string)
      setArticleData(data)
      setIsLoading(false)
    } catch (error) {
      toast({
        title: '加载失败',
        description: String(error),
        variant: 'destructive',
      })
      router.push('/404')
    }
  }

  const handleSubmit = async (data: Partial<CaseArticle>) => {
    try {
      await updateArticle(id as string, data)
      toast({
        title: '更新成功',
        description: '文章已成功更新',
        className: 'bg-primary text-primary-foreground',
      })
      const caseId = (articleData?.caseId as CaseItem)?._id || articleData?.caseId
      router.push(`/case/${caseId}?tab=articles&articleId=${id}`)
    } catch (error) {
      toast({
        title: '更新失败',
        description: String(error),
        variant: 'destructive',
      })
    }
  }

  return (
    <ContentEditor
      title={articleData?.title || ''}
      content={articleData?.content || ''}
      tags={articleData?.tags || []}
      description={articleData?.description || ''}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      config={{
        submitText: '更新文章',
        showDescription: false,
      }}
    />
  )
}