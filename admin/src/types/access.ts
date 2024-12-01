/** 管理员权限类型 */
export const AdminAccess = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
} as const;

export type AdminAccessType = typeof AdminAccess[keyof typeof AdminAccess];

/** 管理员权限配置 */
export interface AdminAccessConfig {
  text: string;
  status: 'error' | 'processing';
  description: string;
  value: AdminAccessType;
}

/** 管理员权限映射 */
export const ADMIN_ACCESS_CONFIG: Record<AdminAccessType, AdminAccessConfig> = {
  [AdminAccess.SUPER_ADMIN]: {
    text: '超级管理员',
    status: 'error',
    description: '拥有所有权限',
    value: AdminAccess.SUPER_ADMIN,
  },
  [AdminAccess.ADMIN]: {
    text: '管理员',
    status: 'processing',
    description: '拥有部分权限',
    value: AdminAccess.ADMIN,
  },
};

/** ProComponents 的 valueEnum 类型 */
export const ADMIN_ACCESS_MAP = {
  [AdminAccess.SUPER_ADMIN]: {
    text: ADMIN_ACCESS_CONFIG[AdminAccess.SUPER_ADMIN].text,
    status: ADMIN_ACCESS_CONFIG[AdminAccess.SUPER_ADMIN].status,
  },
  [AdminAccess.ADMIN]: {
    text: ADMIN_ACCESS_CONFIG[AdminAccess.ADMIN].text,
    status: ADMIN_ACCESS_CONFIG[AdminAccess.ADMIN].status,
  },
};

/** 表单选项 */
export const ADMIN_ACCESS_OPTIONS = Object.values(ADMIN_ACCESS_CONFIG).map(
  (config) => ({
    label: config.text,
    value: config.value,
  })
);

/** 权限检查函数 */
export const checkAccess = (access: AdminAccessType) => {
  return access === AdminAccess.SUPER_ADMIN;
};
