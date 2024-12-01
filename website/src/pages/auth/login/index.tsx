'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { login, getLoginCaptcha } from '@/api/auth'
import AuthCard from '@/components/auth/AuthCard'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { UserRole } from '@/types/user'
import { useAuth } from '@/hooks/auth-context'
  const loginSchema = z.object({
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  password: z.string().optional(),
  captcha: z.string().optional(),
  autoLogin: z.boolean().default(false)
})

export default function LoginPage() {
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') as UserRole || UserRole.DEVELOPER
  const [role, setRole] = useState<UserRole>(initialRole)
  const [isLoading, setIsLoading] = useState(false)
  const [loginType, setLoginType] = useState<'password' | 'captcha'>('password')
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const { login: authLogin } = useAuth()
  const [callbackUrl, setCallbackUrl] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const callbackUrl = searchParams.get('callbackUrl')
    setCallbackUrl(callbackUrl || '')
    console.log("callbackUrl from login useEffect:", callbackUrl)
  }, [])

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      captcha: '',
      autoLogin: false
    }
  })

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true)
    try {
      const res = await login(role, loginType, values)
      console.log("res.data from login:", res.data)
      if (res.data.status === 'success') {
        authLogin(res.data.token, res.data.data)
        toast({
          title: '登录成功',
          description: '欢迎回来！',
          duration: 3000
        })
        console.log("callbackUrl from login onSubmit:", callbackUrl)
        if (callbackUrl && (
          callbackUrl.startsWith('/') ||
          callbackUrl.startsWith(window.location.origin)
        )) {
          const path = callbackUrl.startsWith('/')
            ? callbackUrl
            : new URL(callbackUrl).pathname + new URL(callbackUrl).search

          router.replace(path)
        } else {
          router.replace('/')
        }
      } else {
        toast({
          variant: 'destructive',
          title: '登录失败',
          description: res.data.message,
          duration: 5000
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '登录失败',
        description: '登录失败：' + error,
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetCaptcha = async () => {
    const email = form.getValues('email')
    if (!email) {
      toast({
        variant: 'destructive',
        title: '发送失败',
        description: '请输入邮箱',
        duration: 5000
      })
      return
    }

    try {
      await getLoginCaptcha(role, { email })
      toast({
        title: '验证码已发送至:\n' + email,
        duration: 3000
      })
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '发送失败',
        description: '发送失败：' + error,
        duration: 5000
      })
    }
  }

  return (
    <AuthCard
      title="欢迎来到 ParalHub"
      role={role}
      onRoleChange={setRole}
      loginOrRegister="login"
      footer={{
        text: '还没有账号？',
        linkText: '立即注册',
        href: '/auth/register'
      }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>邮箱</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="请输入邮箱"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {loginType === 'password' ? (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="password"
                        placeholder="请输入密码"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="captcha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>验证码</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <div className="relative flex-1">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="请输入验证码"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-32 shrink-0"
                      disabled={countdown > 0}
                      onClick={handleGetCaptcha}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="link"
              className="px-0 text-sm text-muted-foreground"
              onClick={() => setLoginType(loginType === 'password' ? 'captcha' : 'password')}
            >
              {loginType === 'password' ? '使用验证码登录' : '使用密码登录'}
            </Button>
            <Button type="button" variant="link" className="px-0" asChild>
              <Link href="/auth/forgot-password">忘记密码？</Link>
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            登录
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}