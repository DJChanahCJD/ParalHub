'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor'
import { useToast } from '@/hooks/use-toast'
import { getTags } from '@/api/common'
import { MultiSelect, Option } from '@/components/ui/multi-select'
import { Loader2 } from 'lucide-react'

interface ContentEditorProps {
  // 基础属性
  title: string
  content: string
  tags: string[]
  description?: string
  isLoading?: boolean
  initialContent?: string

  // 回调函数
  onSubmit: (data: {
    title: string
    content: string
    tags: string[]
    description?: string
  }) => Promise<void>
  onCancel?: () => void

  // 配置项
  config?: {
    showDescription?: boolean
    titlePlaceholder?: string
    descriptionPlaceholder?: string
    submitText?: string
    cancelText?: string
    minTitleLength?: number
    maxTitleLength?: number
    maxDescriptionLength?: number
    minTags?: number
    maxTags?: number
    editorHeight?: string
  }
}

export function ContentEditor({
  title: initialTitle = '',
  content: initialContent = '',
  tags: initialTags = [],
  description: initialDescription = '',
  isLoading = false,
  onSubmit,
  onCancel,
  config = {},
}: ContentEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState(() => initialTitle)
  const [description, setDescription] = useState(() => initialDescription)
  const [tags, setTags] = useState<string[]>(() => initialTags)
  const [content, setContent] = useState(() => initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagOptions, setTagOptions] = useState<Option[]>([])

  useEffect(() => {
    setTitle(initialTitle)
    setDescription(initialDescription)
    setTags(initialTags)
    setContent(initialContent)
  }, [initialTitle, initialDescription, initialTags, initialContent])

  // 默认配置
  const defaultConfig = {
    showDescription: false,
    titlePlaceholder: '请输入标题',
    descriptionPlaceholder: '请输入描述（可选）',
    submitText: '提交',
    cancelText: '取消',
    minTitleLength: 4,
    maxTitleLength: 64,
    maxDescriptionLength: 256,
    minTags: 1,
    maxTags: 5,
    editorHeight: 'calc(100vh-theme(spacing.16))',
    ...config,
  }

  // 加载可用标签
  useEffect(() => {
    loadAvailableTags()
  }, [])

  const loadAvailableTags = async () => {
    try {
      const { data } = await getTags()
      setTagOptions(data.map(tag => ({
        _id: tag.name,
        name: tag.name,
      })))
    } catch {
      toast({
        title: '加载标签失败',
        description: '无法加载可用标签',
        variant: 'destructive',
      })
    }
  }

  // 处理标签变化
  const handleTagsChange = (selectedTags: string[]) => {
    setTags(selectedTags)
  }

  const validateForm = () => {
    if (!title.trim() || title.trim().length < defaultConfig.minTitleLength) {
      toast({
        title: '标题过短',
        variant: 'destructive',
      })
      return false
    }
    if (title.trim().length > defaultConfig.maxTitleLength) {
      toast({
        title: `标题不能超过${defaultConfig.maxTitleLength}个字符`,
        variant: 'destructive',
      })
      return false
    }
    if (tags.length < defaultConfig.minTags) {
      toast({
        title: `请至少添加${defaultConfig.minTags}个标签`,
        variant: 'destructive',
      })
      return false
    }
    if (tags.length > defaultConfig.maxTags) {
      toast({
        title: `标签不能超过${defaultConfig.maxTags}个`,
        variant: 'destructive',
      })
      return false
    }
    if (description && description.length > defaultConfig.maxDescriptionLength) {
      toast({
        title: `描述不能超过${defaultConfig.maxDescriptionLength}个字符`,
        variant: 'destructive',
      })
      return false
    }
    if (!content.trim()) {
      toast({
        title: '请填写内容',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title,
        description,
        tags,
        content,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card sticky top-0">
        <div className="container mx-auto px-4 py-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Input
              placeholder={defaultConfig.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg flex-grow"
            />
            <MultiSelect
              options={tagOptions}
              selected={tags}
              onChange={handleTagsChange}
              placeholder="选择标签..."
              emptyText="没有找到标签"
              className="w-full max-w-md"
            />
          </div>

          {defaultConfig.showDescription && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Textarea
                placeholder={defaultConfig.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-grow resize-none"
                rows={2}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={onCancel || (() => router.back())}
              disabled={isSubmitting}
            >
              {defaultConfig.cancelText}
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : defaultConfig.submitText}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 container mx-auto px-4">
        <MarkdownEditor
          value={content}
          onChange={setContent}
          className={`h-[${defaultConfig.editorHeight}]`}
        />
      </div>
    </div>
  )
} 