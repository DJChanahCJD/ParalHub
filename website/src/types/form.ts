// 首先定义验证规则类型
export interface ValidationRule {
    required?: boolean
    message: string
    pattern?: RegExp
    minLength?: number
    maxLength?: number
    validator?: (value: string) => boolean | Promise<boolean>
}

// 表单字段验证规则
export const formRules: Record<string, ValidationRule[]> = {
    // 用户基本信息
    username: [
        { required: true, message: '请输入用户名' },
        { minLength: 3, message: '用户名长度不能小于3位' }
    ],
    realname: [
        { required: true, message: '请输入真实姓名' }
    ],
    email: [
        { required: true, message: '请输入邮箱' },
        { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱格式' }
    ],
    password: [
        { required: true, message: '请输入密码' },
        { minLength: 8, message: '密码长度不能小于8位' },
        { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, message: '密码必须包含大小写字母和数字' }
    ],
    confirmPassword: [
        { required: true, message: '请确认密码' },
        {
            validator: (value: string) => value === document.querySelector<HTMLInputElement>('input[name="password"]')?.value,
            message: '两次输入的密码不一致'
        }
    ],
    code: [
        { required: true, message: '请输入验证码' },
        { pattern: /^\d{6}$/, message: '验证码为6位数字' }
    ],
    phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
    ],

    // 开发者特有字段
    skills: [
        { required: true, message: '请选择技能' }
    ],
    bio: [
        { maxLength: 1024, message: '个人简介不能超过1024字' }
    ],

    // 企业特有字段
    company: [
        { required: true, message: '请输入企业名称' }
    ],
    industry: [
        { required: true, message: '请选择所属行业' }
    ],
    scale: [
        { required: true, message: '请选择企业规模' }
    ],
    contact: [
        { required: true, message: '请输入联系人' }
    ],
    address: [
        { maxLength: 200, message: '地址不能超过200字' }
    ]
}

// 定义表单数据类型
export interface FormData {
    username: string
    realname: string
    email: string
    code: string
    password: string
    confirmPassword: string
    phone: string
    skills: string
    bio?: string
    company: string
    industry: string
    scale: string
    contact: string
    address: string
}

// 定义角色类型
export type Role = 'developer' | 'enterprise'

// 定义必填字段映射
export const requiredFields: Record<Role, string[]> = {
    developer: ['username', 'email', 'password', 'confirmPassword', 'code', 'skills'],
    enterprise: ['company', 'industry', 'scale', 'contact', 'email', 'password', 'confirmPassword', 'code']
}