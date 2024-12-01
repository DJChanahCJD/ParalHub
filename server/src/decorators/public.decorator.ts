// src/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * 定义一个常量键，用于在装饰器中设置元数据
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public 装饰器用于标记某个路由为公开路由，跳过全局认证守卫的认证
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
