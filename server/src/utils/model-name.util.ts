export const MODEL_COLLECTION_MAP = {
  AdminUser: 'admin_users',
  DeveloperUser: 'developer_users',
  EnterpriseUser: 'enterprise_users',
} as const;

export type ModelName = keyof typeof MODEL_COLLECTION_MAP;

export function getCollectionName(modelName: ModelName): string {
  return MODEL_COLLECTION_MAP[modelName];
}
