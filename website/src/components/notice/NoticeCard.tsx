'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BellRing, Clock, Users } from 'lucide-react'
import { formatDistanceToNow } from "date-fns"
import { zhCN } from 'date-fns/locale'
import { Badge } from "@/components/ui/badge"
import { Notice } from "@/api/notice"
import { cn } from "@/lib/utils"

const TYPE_STYLES = {
  system: 'border-blue-100 bg-blue-50/50',
  announcement: 'border-green-100 bg-green-50/50',
  notification: 'border-yellow-100 bg-yellow-50/50'
} as const

const TYPE_LABELS = {
  system: '系统通知',
  announcement: '公告',
  notification: '提醒'
} as const

export function NoticeCard({ notice }: { notice: Notice }) {
  if (notice.status !== 'published') return null

  const isExpired = new Date(notice.expireTime) < new Date()
  if (isExpired) return null

  const timeAgo = formatDistanceToNow(new Date(notice.publishTime || notice.updatedAt), {
    addSuffix: true,
    locale: zhCN
  })

  return (
    <Card className={cn("mb-4 overflow-hidden", TYPE_STYLES[notice.type])}>
      <CardHeader className="flex flex-row items-center space-y-0 py-4">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <BellRing className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <h2 className="font-bold text-blue-900 text-lg">{notice.title}</h2>
        </div>
        <Badge className="flex-shrink-0 ml-3">
          {TYPE_LABELS[notice.type]}
        </Badge>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm leading-relaxed text-blue-800">{notice.content}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-blue-600">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{timeAgo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {notice.target === 'all' ? '所有用户' :
                 notice.target === 'enterprise' ? '企业用户' : '开发者'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}