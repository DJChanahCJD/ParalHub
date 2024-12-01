import { cn } from '@/lib/utils'
import { Trophy, Code2, Building2, User2 } from 'lucide-react'

// 角色配置
const roleConfigs = {
  admin: {
    icon: Trophy,
    label: '管理员',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  developer: {
    icon: Code2,
    label: '开发者',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  enterprise: {
    icon: Building2,
    label: '企业',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  unverified: {
    icon: Building2,
    label: '待认证企业',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  default: {
    icon: User2,
    label: '用户',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
} as const

type RoleType = keyof typeof roleConfigs

export const RoleBadge = ({ role }: { role: string }) => {
  const config = roleConfigs[role as RoleType] || roleConfigs.default
  const Icon = config.icon

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      "transition-colors duration-200",
      config.className
    )}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </div>
  )
}