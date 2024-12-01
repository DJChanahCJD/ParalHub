import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// cn (className) 函数用于合并和处理 CSS 类名
// 它使用 clsx 来合并多个类名，并使用 tailwind-merge 来处理 Tailwind CSS 类名冲突
// 参数:
// - inputs: 任意数量的类名值(字符串、对象或数组)
// 返回:
// - 合并后的类名字符串
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  const now = new Date()
  const updated = new Date(date)
  const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) {
    return 'just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  } else if (diffInDays === 1) {
    return 'yesterday'
  } else if (diffInDays < 30) {
    return `${diffInDays} days ago`
  } else {
    return `${formatDateToMonthDayYear(date)}`
  }
}

function formatDateToMonthDayYear(dateString: string) {
  const date = new Date(dateString)

  // 确保日期有效
  if (isNaN(date.getTime())) {
    return ''
  }

  // 月份名称数组
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()

  // 返回格式: "Jan 19, 2019"
  return `${month} ${day}, ${year}`
}

export const redirectToLogin = () => {
  const currentPath = `${window.location.pathname}${window.location.search}`
  window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`
}