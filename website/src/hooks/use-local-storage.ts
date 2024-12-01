import { useState, useEffect } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T | null = null
): {
  value: T | null
  setValue: (value: T | null) => void
} {
  // 获取初始值
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  // 更新存储的值
  const setValue = (value: T | null) => {
    try {
      setStoredValue(value)
      if (typeof window === 'undefined') {
        return
      }

      if (value === null) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, JSON.stringify({
          ...value,
          updatedAt: new Date().toISOString()
        }))
      }
    } catch (error) {
      console.error(error)
    }
  }

  // 监听其他标签页的变化
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : null
          setStoredValue(newValue)
        } catch (error) {
          console.error(error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return { value: storedValue, setValue }
}