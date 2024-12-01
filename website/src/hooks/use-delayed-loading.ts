import { useState, useCallback } from 'react'

export function useDelayedLoading(minLoadingTime = 1000) {
  const [isLoading, setIsLoading] = useState(false)

  const startLoading = useCallback(async (loadingFn: () => Promise<void>) => {
    setIsLoading(true)
    const startTime = Date.now()

    try {
      await loadingFn()
    } finally {
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }
      setIsLoading(false)
    }
  }, [minLoadingTime])

  return { isLoading, startLoading, setIsLoading }
}