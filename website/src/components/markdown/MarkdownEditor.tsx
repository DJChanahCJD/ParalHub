import React, { useCallback } from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/api/upload';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  error?: boolean;
  errorMessage?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  className,
  error,
  errorMessage,
}) => {
  const { toast } = useToast();

  const handleImageUpload = async (
    file: File,
    cursorPosition: number
  ): Promise<void> => {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('只支持图片文件');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('图片大小不能超过5MB');
      }

      toast({
        title: '上传中',
        description: `正在上传图片 ${file.name}...`,
      });

      console.log('开始上传图片', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const imageUrl = await uploadImage(file, 'article');

      console.log('图片上传成功', imageUrl);

      // 在光标位置插入图片
      const newContent =
        value.slice(0, cursorPosition) +
        `![${file.name}](${imageUrl})` +
        value.slice(cursorPosition);

      onChange(newContent);

      toast({
        title: '上传成功',
        description: '图片已插入到编辑器',
        className: 'bg-primary text-primary-foreground',
      });
    } catch (error) {
      console.error('图片上传失败', error);
      toast({
        title: '上传失败',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // 将粘贴处理提取为单独的函数
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    console.log('粘贴事件触发 - 外层处理器');
    const items = event.clipboardData?.items;
    if (!items) return;

    console.log('剪贴板内容:', {
      items: Array.from(items).map(item => ({
        type: item.type,
        kind: item.kind
      }))
    });

    // 处理所有图片
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (!file) {
          console.log('无法获取文件对象');
          continue;
        }

        console.log('处理图片文件:', {
          name: file.name,
          type: file.type,
          size: file.size
        });

        // 获取编辑器的文本区域
        const textArea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
        if (!textArea) {
          console.log('无法获取编辑器文本区域');
          return;
        }

        await handleImageUpload(file, textArea.selectionStart);
      }
    }
  }, [value, onChange]);

  // 组件挂载时添加粘贴事件监听
  React.useEffect(() => {
    // 修改：直接监听文本输入区域
    const textArea = document.querySelector('.w-md-editor-text-input');
    if (textArea) {
      // 修改：正确的事件类型转换
      textArea.addEventListener('paste', handlePaste as unknown as EventListener);
      return () => {
        textArea.removeEventListener('paste', handlePaste as unknown as EventListener);
      };
    }
  }, [handlePaste]);

  return (
    <div
      className="flex flex-col h-full"
      // 添加：在外层容器也监听粘贴事件
      onPaste={e => {
        // 转换事件类型
        handlePaste(e as unknown as ClipboardEvent);
      }}
    >
      <div
        data-color-mode="light"
        className="h-full relative"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('drag-over');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('drag-over');
        }}
      >
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          preview="live"
          className={cn(
            "h-full !border-none",
            error && "border-red-500",
            className
          )}
          commands={[
            commands.bold,
            commands.italic,
            commands.strikethrough,
            commands.hr,
            commands.title,
            commands.divider,
            commands.link,
            commands.quote,
            commands.code,
            commands.image,
            commands.divider,
            commands.unorderedListCommand,
            commands.orderedListCommand,
            commands.checkedListCommand,
          ]}
          onPaste={e => {
            // 添加：在 MDEditor 组件上也监听粘贴事件
            handlePaste(e as unknown as ClipboardEvent);
          }}
          onDrop={async (event) => {
            event.preventDefault();
            const files = event.dataTransfer?.files;
            if (!files) return;

            console.log('拖放事件触发', {
              files: Array.from(files).map(file => ({
                name: file.name,
                type: file.type,
                size: file.size
              }))
            });

            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file.type.startsWith('image/')) {
                const textArea = event.target as HTMLTextAreaElement;
                await handleImageUpload(file, textArea.selectionStart);
              }
            }
          }}
        />
      </div>
      {error && errorMessage && (
        <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
};