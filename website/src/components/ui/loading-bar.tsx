'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LoadingBarProps {
  isLoading: boolean
}

export function LoadingBar({ isLoading }: LoadingBarProps) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let intervalId: NodeJS.Timeout

    if (isLoading) {
      setVisible(true)
      setProgress(0)

      // 初始快速增长到 30%
      timeoutId = setTimeout(() => {
        setProgress(30)

        // 然后缓慢增长到 85%
        intervalId = setInterval(() => {
          setProgress(prev => {
            if (prev >= 85) {
              clearInterval(intervalId)
              return 85
            }
            // 使用递减的增长速率
            const remaining = 85 - prev
            return prev + remaining * 0.2
          })
        }, 300)
      }, 50)

    } else {
      // 加载完成时，平滑完成剩余进度
      setProgress(100)

      // 等待过渡动画完成后隐藏
      timeoutId = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 400) // 增加淡出时间
    }

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [isLoading])

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-0.5 bg-transparent z-50',
        'transition-opacity duration-300 ease-in-out',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className="h-full bg-blue-500"
        style={{
          width: `${progress}%`,
          transition: 'width 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5), 0 0 5px rgba(59, 130, 246, 0.5)'
        }}
      />
    </div>
  )
}