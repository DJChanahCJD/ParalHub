'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor'
import { useToast } from '@/hooks/use-toast'
import { createCase } from '@/api/case'
import { getTags } from '@/api/common'
import { MultiSelect, Option } from '@/components/ui/multi-select'

const INITIAL_CONTENT = `# 案例描述
请描述你要解决的并行计算问题。

# 解决方案
## 并行策略
你采用了什么并行计算策略？(如数据并行、任务并行等)

## 实现细节
- 使用的并行框架/库 (如 OpenMP, MPI, CUDA 等)
- 数据分割方式
- 线程/进程间通信方式
- 同步策略

# 性能分析
## 加速比
- 串行执行时间:
- 并行执行时间:
- 加速比:
- 并行效率:

## 可扩展性分析
不同处理器核心数/节点数下的性能变化

## 性能瓶颈
遇到的性能瓶颈及解决方案

# 代码实现
\`\`\`cpp
// 在此粘贴你的并行计算代码
\`\`\`

# 实验环境
- 硬件配置:
- 软件环境:

# 总结与思考
- 经验总结
- 可改进之处
`

export default function NewCasePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [content, setContent] = useState(INITIAL_CONTENT)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagOptions, setTagOptions] = useState<Option[]>([])

  // 加载可用标签
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

  // 在组件挂载时加载可用标签
  useEffect(() => {
    loadAvailableTags()
  }, [])

  // 处理标签变化
  const handleTagsChange = (selectedTags: string[]) => {
    setTags(selectedTags)
  }

  const validateForm = () => {
    if (!title.trim() || title.trim().length < 4) {
      toast({
        title: '标题过短',
        variant: 'destructive',
      })
      return false
    }
    if (tags.length === 0) {
      toast({
        title: '请至少添加一个标签',
        variant: 'destructive',
      })
      return false
    }
    if (title.trim().length > 64) {
      toast({
        title: '标题不能超过64个字符',
        variant: 'destructive',
      })
      return false
    }
    if (tags.length > 5) {
      toast({
        title: '标签不能超过5个',
        variant: 'destructive',
      })
      return false
    }
    if (content.trim() === INITIAL_CONTENT.trim()) {
      toast({
        title: '请填写内容',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const handlePublish = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const newCase = await createCase({
        title,
        tags,
        content,
      })
      console.log('newCase：', newCase)
      toast({
        title: '发布成功',
        description: '您的案例已成功发布',
        className: 'bg-primary text-primary-foreground',
      })

      if (newCase?._id) {
        router.push(`/case/${newCase._id}`)
      } else {
        throw new Error('创建成功但未返回ID')
      }
    } catch (error) {
      toast({
        title: '发布失败',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card sticky top-0">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <Input
            placeholder="请输入标题"
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
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              取消
            </Button>
            <Button
              onClick={handlePublish}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? '发布中...' : '发布案例'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 container mx-auto px-4">
        <MarkdownEditor
          value={content}
          onChange={setContent}
          className="h-[calc(100vh-theme(spacing.16))]"
        />
      </div>
    </div>
  )
}