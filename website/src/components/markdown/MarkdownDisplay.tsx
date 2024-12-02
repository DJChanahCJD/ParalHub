import MDEditor from '@uiw/react-md-editor'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownDisplayProps {
  content: string
  className?: string
}

export const MarkdownDisplay = ({ content, className }: MarkdownDisplayProps) => {
  return (
    <MDEditor.Markdown
      source={content}
      className={cn(
        // 基础样式
        "prose prose-sm dark:prose-invert max-w-none",
        // 标题样式
        "[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:pb-2 [&_h1]:border-b",
        "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold",
        "[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium",
        // 段落和列表样式
        "[&_p]:my-3 [&_p]:leading-relaxed",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-2",
        // 代码样式
        "[&_code]:text-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded",
        "[&_pre]:my-4 [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto",
        // 其他元素样式
        "[&_hr]:my-6 [&_hr]:border-border",
        "[&_blockquote]:my-4 [&_blockquote]:pl-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:text-muted-foreground",
        "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse",
        "[&_th]:border [&_th]:border-border [&_th]:px-4 [&_th]:py-2 [&_th]:bg-muted",
        "[&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2",
        className
      )}
      remarkPlugins={[remarkGfm]}
    />
  )
}