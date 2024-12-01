// 基础列表查询参数
export class BaseListParams {
  current?: number = 1;
  pageSize?: number = 10;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

// 技能列表查询参数
export class SkillListParams extends BaseListParams {
  name?: string;
}

// 行业列表查询参数
export class IndustryListParams extends BaseListParams {
  name?: string;
}

// 添加标签列表查询参数
export class TagListParams extends BaseListParams {
  name?: string;
}
