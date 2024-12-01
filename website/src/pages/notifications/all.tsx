'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getNotifications, markAsRead, markAllAsRead, Notification } from '@/api/notification'
import { useState } from 'react'
import { CustomPagination } from '@/components/ui/custom-pagination'

export default function NotificationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 10

  // 获取通知列表
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications-full', page],
    queryFn: () => getNotifications({
      page,
      pageSize
    }),
  })

  // 处理点击通知
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
      queryClient.invalidateQueries({ queryKey: ['notifications-full'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    }

    if (notification.type === 'new_case') {
      router.push(`/case/${notification.contentId}`)
    } else if (notification.type === 'new_article') {
      router.push(`/case/${notification.contentId.split(':')[0]}?tab=articles&articleId=${notification.contentId.split(':')[1]}`)
    }
  }

  // 处理全部已读
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    queryClient.invalidateQueries({ queryKey: ['notifications-full'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
  }

  // 格式化通知内容
  const formatNotificationContent = (notification: Notification) => {
    return (
      <span>
        <span className="font-bold mr-1">{notification.sender.username}</span>
        {notification.title}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-8 max-w-3xl">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">消息通知</h1>
        <Button
          size="sm"
          variant="default"
          onClick={handleMarkAllAsRead}
        >
          全部已读
        </Button>
      </div>

      {/* 通知列表 */}
      <div className="space-y-2">
        {notifications?.items.map((notification) => (
          <div
            key={notification._id}
            className={cn(
              "flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
              !notification.isRead && "bg-muted/30 relative pl-8 before:content-[''] before:absolute before:left-3 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:bg-red-500 before:rounded-full"
            )}
            onClick={() => handleNotificationClick(notification)}
          >
            {/* 发送者头像 */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
              <Image
                src={notification.sender?.avatar || '/default-avatar.png'}
                alt=""
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 消息内容 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                {formatNotificationContent(notification)}
              </p>
              <span className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </span>
            </div>

            {/* 右侧箭头 */}
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        ))}
      </div>

      {/* 分页 */}
      {notifications && notifications.items.length > 0 && (
        <div className="mt-6 flex justify-center">
          <CustomPagination
            current={page}
            pageSize={pageSize}
            total={notifications.total}
            onChange={setPage}
          />
        </div>
      )}

      {/* 无数据提示 */}
      {notifications?.items.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          暂无消息通知
        </div>
      )}
    </div>
  )
}