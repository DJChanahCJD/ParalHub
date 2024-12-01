import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TooltipItem } from '../ui/tooltip-item'

interface AvatarUploadProps {
  currentAvatar?: string
  username?: string
  disabled?: boolean
  onAvatarChange: (file: File) => Promise<void>
}

export function AvatarUpload({
  currentAvatar,
  username,
  disabled,
  onAvatarChange
}: AvatarUploadProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 文件类型检查
    if (!file.type.match(/^image\/(jpg|jpeg|png|gif)$/)) {
      toast({
        variant: "destructive",
        title: "文件类型错误",
        description: "请选择图片文件（JPG、PNG、GIF）"
      })
      return
    }

    // 文件大小检查（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "文件过大",
        description: "图片大小不能超过5MB"
      })
      return
    }

    try {
      setIsUploading(true)
      await onAvatarChange(file)
      toast({
        title: "上传成功",
        description: "头像已更新"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "上传失败",
        description: error instanceof Error ? error.message : "请稍后重试"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => !isUploading && setIsHovering(true)}
      onMouseLeave={() => !isUploading && setIsHovering(false)}
    >
      {/* 将整个区域包装在label中使其可点击 */}
      <label htmlFor="avatar-upload" className={`cursor-pointer ${isUploading || disabled ? 'pointer-events-none' : ''}`} aria-label="更换头像">
        <Avatar className="w-32 h-32">
          <AvatarImage src={currentAvatar} />
          <AvatarFallback>
            {username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* 悬浮时显示的遮罩层 */}
        {isHovering && !isUploading && !disabled && (
          <TooltipItem tooltip="点击上传头像">
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </TooltipItem>
        )}
      </label>

      <input
        id="avatar-upload"
        type="file"
        className="hidden"
        accept="image/*"
        aria-label="更换头像"
        onChange={handleFileChange}
        disabled={isUploading || disabled}
      />

      {/* 上传时的loading效果 */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
        </div>
      )}
    </div>
  )
}