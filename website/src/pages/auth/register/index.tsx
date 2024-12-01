'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'
import { getRegisterSchema } from '@/lib/validations/auth'
import type { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { getIndustries, getScales, getSkills } from '@/api/common'
import { register, getRegisterCaptcha } from '@/api/auth'
import type { Skill, Industry, Scale } from '@/types/api'
import AuthCard from '@/components/auth/AuthCard'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { MultiSelect } from "@/components/ui/multi-select"
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserRole } from '@/types/user'
import { CommandSelect } from "@/components/ui/command-select"
import { validateRegisterData } from '@/lib/validations/auth'

interface BaseFormValues {
  role: UserRole
  username?: string
  realName?: string
  email: string
  emailCaptcha: string
  password: string
  confirmPassword: string
  phone?: string
  address?: string
  bio?: string
}

interface DeveloperFormValues extends BaseFormValues {
  skills: string[]  // ID数组
}

interface CompanyFormValues extends BaseFormValues {
  company: string
  industry: string
  scale: string
  contact: string
}

// API 请求类型
interface DeveloperRegisterRequest extends Omit<DeveloperFormValues, 'skills'> {
  skills: string[]  // 名称数组
}

type CompanyRegisterRequest = CompanyFormValues

type RegisterRequest = DeveloperRegisterRequest | CompanyRegisterRequest

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>(UserRole.DEVELOPER)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [skills, setSkills] = useState<Skill[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [scales, setScales] = useState<Scale[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<ReturnType<typeof getRegisterSchema>>>({
    resolver: zodResolver(getRegisterSchema(role)),
    defaultValues: {
      role: role,
      username: '',
      realName: '',
      email: '',
      emailCaptcha: '',
      password: '',
      confirmPassword: '',
      phone: '',
      bio: '',
      ...(role === UserRole.DEVELOPER ? {
        skills: [],
      } : {
        company: '',
        industry: '',
        scale: '',
        contact: '',
      })
    }
  })

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [skillsRes, industriesRes, scalesRes] = await Promise.all([
          getSkills(),
          getIndustries(),
          getScales(),
        ])

        console.log("skillsRes.data:", skillsRes.data)

        setSkills(skillsRes.data)

        setIndustries(industriesRes.data)

        setScales(scalesRes.data)
      } catch (error) {
        console.error("Load options error:", error)
        toast({
          variant: "destructive",
          title: "加载失败",
          description: String(error),
          duration: 5000
        })
      }
    }
    loadOptions()
  }, [toast])

  const handleSendCode = async () => {
    const email = form.getValues('email')
    if (!email) {
      toast({
        variant: "destructive",
        title: "发送失败",
        description: "请输入邮箱",
        duration: 5000
      })
      return
    }

    try {
      await getRegisterCaptcha(role, { email })
      toast({
        title: "发送成功",
        description: "验证码已发送到您的邮箱",
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
        variant: "destructive",
        title: "发送失败",
        description: String(error),
        duration: 5000
      })
    }
  }

  const onSubmit = async (values: z.infer<ReturnType<typeof getRegisterSchema>>) => {
    console.log('Form values before validation:', values)

    // 先验证数据
    const validationResult = validateRegisterData(role, values)
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error)
      toast({
        variant: "destructive",
        title: "表单验证失败",
        description: "请检查输入的信息是否正确",
      })
      return
    }

    setIsLoading(true)
    try {
      let submitData: RegisterRequest

      if (role === UserRole.DEVELOPER) {
        const skillNames = (values as DeveloperFormValues).skills?.map(skillId =>
          skills.find(skill => skill._id === skillId)?.name || ''
        ).filter(name => name !== '')

        submitData = {
          ...values,
          skills: skillNames,
        } as DeveloperRegisterRequest
      } else {
        submitData = values as CompanyRegisterRequest
      }

      console.log('Submitting data:', submitData)
      const res = await register(role, submitData)
      console.log("res.data:", res.data)
      if (res.data.status === 'success') {
        if (role === UserRole.ENTERPRISE) {
          toast({
            title: "注册成功",
            description: "企业认证审核需1-3个工作日，审核结果将通过邮件通知",
            duration: 5000
          })
        } else {
          toast({
            title: "注册成功",
            description: "正在跳转到登录页面...",
            duration: 2000
          })
        }
        router.push(`/auth/login?role=${role}`)
      } else {
        toast({
          variant: "destructive",
          title: "注册失败",
          description: res.data.message,
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        variant: "destructive",
        title: "注册失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    form.reset({
      role: newRole,
      username: '',
      realName: '',
      email: form.getValues('email'),
      emailCaptcha: form.getValues('emailCaptcha'),
      password: form.getValues('password'),
      confirmPassword: form.getValues('confirmPassword'),
      phone: '',
      bio: '',
      ...(newRole === UserRole.DEVELOPER ? {
        skills: [],
      } : {
        company: '',
        industry: '',
        scale: '',
        contact: '',
      })
    })
  }

  return (
    <AuthCard
      title="欢迎加入 ParalHub"
      role={role}
      onRoleChange={handleRoleChange}
      loginOrRegister="register"
      footer={{
        text: '已有账号？',
        linkText: '立即登录',
        href: '/auth/login'
      }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(
          async (values) => {
            console.log('Form submitted:', values);
            await onSubmit(values);
          },
          (errors) => {
            console.log('Validation errors:', errors);
            toast({
              variant: "destructive",
              title: "验证失败",
              description: "请检查必填项是否填写完整",
              duration: 5000
            });
          }
        )} className="space-y-4">
          <TabsContent value="developer">
            <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="realName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>真实姓名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email and Code */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="emailCaptcha"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>验证码 <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-8"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
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
                    <FormLabel>确认密码 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Skills */}
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>技能 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={skills}
                      selected={field.value as string[]}
                      onChange={field.onChange}
                      placeholder="选择主要技能"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工作经验</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="请简要描述您的个人简介"
                      className="h-20 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
            </div>
          </TabsContent>

          <TabsContent value="enterprise">
            {/* Company Info */}
            <div className="space-y-2">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>企业名称 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>行业 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <CommandSelect
                        options={industries}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="选择所属行业"
                        emptyText="未找到相关行业"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>规模 <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择企业规模" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scales?.map(scale => (
                          <SelectItem key={scale._id} value={scale._id}>
                            {scale.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系人 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email and Code */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="emailCaptcha"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>验证码 <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-8"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
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
                    <FormLabel>确认密码 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Fields */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>企业简介</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="请简要介绍您的企业"
                      className="h-20 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
          </TabsContent>

          {/* 提交按钮 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {/* 当表单提交中时显示加载动画 */}
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            注册
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}