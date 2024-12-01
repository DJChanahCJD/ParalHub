import { useCallback } from 'react'

interface Draft {
  id: string          // 案例ID
  title: string       // 文章标题
  content: string     // 文章内容
  tags?: string[]     // 文章标签
  updatedAt: string   // 更新时间
}

const DRAFT_PREFIX = 'article-draft-'
const DRAFT_EXPIRE_DAYS = 7

export function useDrafts(caseId: string) {
  // 获取当前案例的草稿
  const getCurrentDraft = useCallback(() => {
    try {
      const key = `${DRAFT_PREFIX}${caseId}`
      const draft = localStorage.getItem(key)
      if (!draft) return null

      const parsedDraft = JSON.parse(draft)

      // 检查草稿是否过期
      const updatedAt = new Date(parsedDraft.updatedAt)
      const now = new Date()
      const diffDays = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)

      if (diffDays > DRAFT_EXPIRE_DAYS) {
        localStorage.removeItem(key)
        return null
      }

      return parsedDraft
    } catch (error) {
      console.error('Failed to get draft:', error)
      return null
    }
  }, [caseId])

  // 保存草稿
  const saveDraft = useCallback((data: Omit<Draft, 'id' | 'updatedAt'>) => {
    try {
      const draft: Draft = {
        id: caseId,
        ...data,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(`${DRAFT_PREFIX}${caseId}`, JSON.stringify(draft))
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [caseId])

  // 删除草稿
  const deleteDraft = useCallback(() => {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${caseId}`)
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }, [caseId])

  return {
    draft: getCurrentDraft(),
    saveDraft,
    deleteDraft
  }
}