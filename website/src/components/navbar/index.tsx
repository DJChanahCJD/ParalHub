'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, SquarePen } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/auth-context'
import { TooltipItem } from "@/components/ui/tooltip-item"
import { NotificationPopover } from '@/components/notification/NotificationPopover'

export default function Navbar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const { isAuthenticated, user, logout, loading } = useAuth()

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
    }
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleBlur = () => {
    if (!searchQuery.trim() && searchParams.has('q')) {
      router.push('/')
      setSearchQuery('')
    }
    setIsSearchExpanded(false)
  }

  const handleLogout = async () => {
    logout()
    router.replace('/auth/login')
  }

  if (loading) {
    return (
      <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b">
        <div className="container h-14 mx-auto">
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-[180px]" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b">
      <div className="container h-14 mx-auto">
        <div className="flex h-full items-center justify-between">
          {/* Logo 区域 */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="ParalHub" width={24} height={24} />
              <span className="font-semibold text-lg hover:text-muted-foreground transition-all">ParalHub</span>
            </Link>
          </div>

          {/* 右侧操作区域 */}
          <div className="flex items-center gap-4">
            {/* 搜索表单 */}
            <form onSubmit={handleSearch} className="relative">
              <div className={`flex items-center transition-all duration-200 ease-in-out ${
                isSearchExpanded ? 'w-[300px]' : 'w-[180px]'
              }`}>
                <Input
                  type="search"
                  placeholder="搜索案例..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  onBlur={handleBlur}
                  className={`pl-9 h-9 transition-all duration-200 ${
                    isSearchExpanded ? 'bg-background' : 'bg-muted/50'
                  }`}
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
              </div>
            </form>

            {isAuthenticated ? (
              <>
                {/* 新建按钮 */}
                <TooltipItem tooltip="新建案例">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 hover:bg-muted"
                    onClick={() => router.push('/case/new')}
                  >
                    <SquarePen className="h-4 w-4" />
                  </Button>
                </TooltipItem>

                {/* 替换原来的消息按钮为 NotificationPopover */}
                <div className="-ml-2">
                  <NotificationPopover />
                </div>

                {/* 用户头像下拉菜单 */}
                <DropdownMenu>
                  <TooltipItem tooltip="个人中心">
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-background hover:bg-background/50 transition-all">
                        <Image
                          src={user?.avatar || ''}
                          alt="avatar"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                    </DropdownMenuTrigger>
                  </TooltipItem>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="font-medium leading-none">{user?.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user?._id}`}>个人主页</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={handleLogout}
                    >
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                  <Button
                    variant="ghost"
                  size="sm"
                  className="min-w-[72px]"
                >
                  <Link href="/auth/login" className="w-full h-full flex items-center justify-center">
                    登录
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="min-w-[72px]"
                >
                  <Link href="/auth/register" className="w-full h-full flex items-center justify-center">
                    注册
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}