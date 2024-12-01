import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 设置一个定时器来延迟更新值
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 清理函数：如果 value 在 delay 时间内再次改变，清除之前的定时器
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}