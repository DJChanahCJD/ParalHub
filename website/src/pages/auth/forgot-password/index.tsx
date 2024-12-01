'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { getResetPasswordCaptcha, resetPassword } from '@/api/auth'
import AuthCard from '@/components/auth/AuthCard'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { UserRole } from '@/types/user'

const resetPasswordSchema = z.object({
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  token: z.string().min(1, { message: '请输入验证码' }),
  newPassword: z.string().min(6, { message: '密码至少6位' }),
  confirmPassword: z.string().min(6, { message: '密码至少6位' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export default function ForgotPasswordPage() {
  const [role, setRole] = useState<UserRole>(UserRole.DEVELOPER)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      token: '',
      newPassword: '',
      confirmPassword: '',
    }
  })

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true)
    try {
      const res = await resetPassword(role, {
        email: values.email,
        token: values.token,
        newPassword: values.newPassword,
      })

      if (res.data.status === 'success') {
        toast({
          title: '密码重置成功',
          description: '请使用新密码登录',
          duration: 3000
        })
        router.push('/auth/login')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '重置失败',
        description: error.response?.data?.message || '未知错误',
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
      await getResetPasswordCaptcha(role, { email })
      toast({
        title: '验证码已发送',
        description: '请查看邮箱',
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
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '发送失败',
        description: error.response?.data?.message || '未知错误',
        duration: 5000
      })
    }
  }

  return (
    <AuthCard
      title="重置密码"
      subtitle="请输入您的邮箱以重置密码"
      role={role}
      onRoleChange={setRole}
      loginOrRegister="login"
      footer={{
        text: '记起密码了？',
        linkText: '返回登录',
        href: '/auth/login'
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

          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>验证码</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="请输入验证码"
                    />
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

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>新密码</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="password"
                      placeholder="请输入新密码"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>确认密码</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="password"
                      placeholder="请再次输入新密码"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            重置密码
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}