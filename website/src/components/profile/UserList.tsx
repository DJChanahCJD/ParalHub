import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { UserCard } from './UserCard'
import { useDebounce } from '@/hooks/use-debounce'
import { useEffect, Key } from 'react'
import { getFollowers, getFollowing } from '@/api/follow'
import { Loader2 } from 'lucide-react'
import { User } from '@/types/user'
import { cn } from '@/lib/utils'

interface UserListProps {
  userId: string
  type: 'following' | 'followers'
  search: string
  onFollowChange?: (isFollowing: boolean) => void
  className?: string
}

export function UserList({ userId, type, search, onFollowChange, className }: UserListProps) {
  const debouncedSearch = useDebounce(search, 500)
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['users', type, userId, debouncedSearch],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const response = type === 'following'
        ? await getFollowing(userId, {
            current: pageParam,
            username: debouncedSearch,
            pageSize: 10,
          })
        : await getFollowers(userId, {
            current: pageParam,
            username: debouncedSearch,
            pageSize: 10,
          })
      return response.data
    },
    getNextPageParam: (lastPage) => {
      // 如果当前页数据不足 10 条，说明没有下一页
      if (!lastPage.data?.length || lastPage.data.length < 10) {
        return undefined
      }
      // 返回下一页的页码
      return lastPage.current + 1
    },
  })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className={cn("w-full flex flex-col gap-4", className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-muted animate-pulse rounded-md"
          />
        ))}
      </div>
    )
  }

  if (data?.pages[0]?.data.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div className="text-center text-muted-foreground py-8">
          没有找到用户
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {data?.pages.map((page, i) => (
        <div key={i} className="flex flex-col gap-4 px-4">
          {page.data.map((user: { _id: Key | null | undefined; user: User; isFollowing: boolean }) => (
            <UserCard
              key={user._id}
              user={user.user}
              isFollowing={user.isFollowing}
              onFollowChange={onFollowChange}
            />
          ))}
        </div>
      ))}

      <div
        ref={ref}
        className="h-4 flex items-center justify-center px-4"
      >
        {isFetchingNextPage && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
      </div>
    </div>
  )
}