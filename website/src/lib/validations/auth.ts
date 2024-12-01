import * as z from "zod"
import { UserRole } from "@/types/user"

// 基础字段验证
const baseSchema = z.object({
  role: z.nativeEnum(UserRole),
  username: z.string().optional(),
  realName: z.string().optional(),
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
  emailCaptcha: z.string().min(4, { message: "请输入验证码" }),
  password: z.string().min(6, { message: "密码至少需要6个字符" }),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
})

// 开发者注册表单
export const developerRegisterSchema = baseSchema.extend({
  skills: z.array(z.string()).min(1, { message: "请至少选择一个技能" }),
  contact: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
}).refine((data) => data.role === UserRole.DEVELOPER, {
  message: "角色类型不匹配",
  path: ["role"],
})

// 企业注册表单
export const enterpriseRegisterSchema = baseSchema.extend({
  company: z.string().min(2, { message: "请输入企业名称" }),
  industry: z.string().min(1, { message: "请选择所属行业" }),
  scale: z.string().min(1, { message: "请选择企业规模" }),
  contact: z.string().min(2, { message: "请输入联系人" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
}).refine((data) => data.role === UserRole.ENTERPRISE, {
  message: "角色类型不匹配",
  path: ["role"],
})


// 根据角色选择验证模式
export const getRegisterSchema = (role: UserRole) => {
  const schema = role === UserRole.DEVELOPER
    ? developerRegisterSchema
    : enterpriseRegisterSchema

  return z.preprocess((data) => {
    console.log('Preprocessing form data:', {
      role,
      rawData: data,
      validation: schema.safeParse(data)
    })
    return data
  }, schema)
}

// 在表单提交时使用
export const validateRegisterData = (role: UserRole, data: unknown) => {
  const schema = getRegisterSchema(role)
  const result = schema.safeParse(data)

  console.log('Validation result:', {
    success: result.success,
    data: result.success ? result.data : undefined,
    errors: !result.success ? result.error.format() : undefined,
    input: data
  })

  return result
}