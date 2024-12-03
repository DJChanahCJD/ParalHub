'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useToast } from '@/hooks/use-toast'
import { getCaseDetail, updateCase } from '@/api/case'
import { ContentEditor } from '@/components/editor/ContentEditor'
import { CaseItem } from '@/types/case'

export default function EditCasePage() {
  const router = useRouter()
  const { id } = router.query
  const { toast } = useToast()
  const [caseData, setCaseData] = useState<CaseItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadCaseDetail()
    }
  }, [id])

  const loadCaseDetail = async () => {
    try {
      const data = await getCaseDetail(id as string)
      setCaseData(data)
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

  const handleSubmit = async (data: Partial<CaseItem>) => {
    try {
      await updateCase(id as string, data)
      toast({
        title: '更新成功',
        description: '案例已成功更新',
        className: 'bg-primary text-primary-foreground',
      })
      router.push(`/case/${id}`)
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
      title={caseData?.title || ''  }
      content={caseData?.content || ''}
      tags={caseData?.tags || []}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      config={{
        submitText: '更新案例',
        showDescription: false,
      }}
    />
  )
}