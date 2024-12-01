import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { Inbox, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, Notification } from '@/api/notification'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export function NotificationPopover() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ page: 1, pageSize: 20 }),
  })

  const { data: hasUnread } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const data = await getUnreadCount()
      return data.count > 0
    },
  })

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    }

    if (notification.type === 'new_case') {
      router.push(`/case/${notification.contentId}`)
    } else if (notification.type === 'new_article') {
      router.push(`/case/${notification.contentId.split(':')[0]}?tab=articles&articleId=${notification.contentId.split(':')[1]}`)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
  }

  const formatNotificationContent = (notification: Notification) => {
    return (
      <span>
        <span className="font-bold mr-1">{notification.sender.username}</span>
        {notification.title}
      </span>
    )
  }

  return (
    <HoverCard openDelay={0} closeDelay={200}>
      <HoverCardTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9 hover:bg-muted"
        >
          <Inbox className="h-4 w-4" />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="end"
        side="bottom"
        className="w-[380px] p-0"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-medium">消息通知</h4>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs hover:bg-muted"
              onClick={handleMarkAllAsRead}
            >
              全部已读
            </Button>
          )}
        </div>

        {/* 消息列表 */}
        <ScrollArea className="h-[400px]">
          {isLoadingNotifications ? (
            <div className="p-4 text-center text-muted-foreground">
              加载中...
            </div>
          ) : notifications?.items?.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              暂无消息
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications?.items?.map((notification) => (
                <div
                  key={notification._id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-muted/80 cursor-pointer border-b last:border-b-0",
                    !notification.isRead && "bg-muted/30 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:bg-red-500 before:rounded-full"
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
          )}
        </ScrollArea>

        {/* 底部 */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm h-9 hover:bg-muted"
            onClick={() => router.push(`/notifications/all`)}
          >
            查看全部
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}