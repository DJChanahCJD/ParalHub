import { ReactNode } from 'react'
import { Code2, Building2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Link from 'next/link'
import Image from 'next/image'
import { UserRole } from '@/types/user'
interface AuthCardProps {
  logo?: string
  title: string
  subtitle?: string
  role: UserRole
  onRoleChange: (role: UserRole) => void
  loginOrRegister: 'login' | 'register'
  footer: {
    text: string
    linkText: string
    href: string
  }
  children: ReactNode
}

export default function AuthCard({
  logo = '/logo.svg',
  title,
  subtitle = '东八区最小的并行计算案例分享平台',
  role,
  onRoleChange,
  loginOrRegister,
  footer,
  children
}: AuthCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-indigo-900 dark:to-gray-900 flex items-start justify-center p-4 pt-8">
      <Card className="w-full max-w-md bg-white/90 dark:bg-gray-800/90">
        <CardHeader className="space-y-0 pb-2">
          <div className="flex items-center space-x-3">
            <div>
              <Image src={logo} alt="logo" width={32} height={32} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue={role} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger
                value={UserRole.DEVELOPER}
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-colors"
                onClick={() => onRoleChange(UserRole.DEVELOPER)}
              >
                <Code2 className="w-4 h-4 mr-2" />
                开发者{loginOrRegister === 'login' ? '登录' : '注册'}
              </TabsTrigger>
              <TabsTrigger
                value={UserRole.ENTERPRISE}
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-colors"
                onClick={() => onRoleChange(UserRole.ENTERPRISE)}
              >
                <Building2 className="w-4 h-4 mr-2" />
                企业{loginOrRegister === 'login' ? '登录' : '注册'}
              </TabsTrigger>
            </TabsList>

            {children}
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {footer.text}{' '}
            <Link href={footer.href} className="text-primary hover:underline font-medium">
              {footer.linkText}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}