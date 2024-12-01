import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IndustryListParams,
  SkillListParams,
  TagListParams,
} from 'src/types/common';
import {
  Skill,
  Industry,
  SkillDocument,
  IndustryDocument,
  ISkill,
  IIndustry,
  Tag,
  TagDocument,
  ITag,
} from 'src/schema/common.schema';

@Injectable()
export class CommonProvider {
  constructor(
    @InjectModel(Industry.name) private industryModel: Model<IndustryDocument>,
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
  ) {}

  /* 通用分页查询方法 */
  private async findWithPagination<T, R>(
    model: Model<T>,
    params: any,
    queryBuilder: (params: any) => any = () => ({}),
  ): Promise<{
    data: R[];
    total: number;
    pageSize: number;
    current: number;
    success: boolean;
  }> {
    const {
      current = 1,
      pageSize = 10,
      sortField,
      sortOrder,
      ...rest
    } = params || {};

    // 构建查询条件
    const query = queryBuilder(rest);

    // 构建排序条件
    const sort: any = {};
    if (sortField) {
      sort[sortField] = sortOrder === 'ascend' ? 1 : -1;
    } else {
      sort.updatedAt = -1; // 默认按更新时间倒序
    }

    // 执行查询
    const [data, total] = await Promise.all([
      model
        .find(query)
        .sort(sort)
        .skip((current - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      model.countDocuments(query),
    ]);

    console.log('data from common provider', data);

    return {
      data: data as any[],
      total,
      pageSize,
      current,
      success: true,
    };
  }

  async getAllSkills(): Promise<ISkill[]> {
    return this.skillModel.find().lean();
  }

  async getAllIndustries(): Promise<IIndustry[]> {
    return this.industryModel.find().lean();
  }

  /* 行业相关方法 */
  async getIndustryOptions(params: IndustryListParams) {
    return this.findWithPagination<IndustryDocument, IIndustry>(
      this.industryModel,
      params,
      (rest) => ({
        ...(rest.name ? { name: { $regex: rest.name, $options: 'i' } } : {}),
      }),
    );
  }

  async createIndustry(industry: Partial<IIndustry>): Promise<IIndustry> {
    return this.industryModel.create(industry);
  }

  async updateIndustry(
    id: string,
    industry: Partial<IIndustry>,
  ): Promise<IIndustry | null> {
    return this.industryModel.findByIdAndUpdate(id, industry, { new: true });
  }

  async deleteIndustry(id: string): Promise<void> {
    await this.industryModel.findByIdAndDelete(id);
  }

  /* 技能相关方法 */
  async getSkillOptions(params: SkillListParams) {
    return this.findWithPagination<SkillDocument, ISkill>(
      this.skillModel,
      params,
      (rest) => ({
        ...(rest.name ? { name: { $regex: rest.name, $options: 'i' } } : {}),
      }),
    );
  }

  async createSkill(skill: Partial<ISkill>): Promise<ISkill> {
    return this.skillModel.create(skill);
  }

  async updateSkill(
    id: string,
    skill: Partial<ISkill>,
  ): Promise<ISkill | null> {
    return this.skillModel.findByIdAndUpdate(id, skill, { new: true });
  }

  async deleteSkill(id: string): Promise<void> {
    await this.skillModel.findByIdAndDelete(id);
  }

  async getSkillById(id: string): Promise<ISkill | null> {
    return this.skillModel.findById(id).lean();
  }

  /* 标签相关方法 */
  async getAllTags(): Promise<ITag[]> {
    return this.tagModel.find().lean();
  }

  async getTagOptions(params: TagListParams) {
    return this.findWithPagination<TagDocument, ITag>(
      this.tagModel,
      params,
      (rest) => ({
        ...(rest.name ? { name: { $regex: rest.name, $options: 'i' } } : {}),
      }),
    );
  }

  async createTag(tag: Partial<ITag>): Promise<ITag> {
    return this.tagModel.create(tag);
  }

  async updateTag(id: string, tag: Partial<ITag>): Promise<ITag | null> {
    return this.tagModel.findByIdAndUpdate(id, tag, { new: true });
  }

  async deleteTag(id: string): Promise<void> {
    await this.tagModel.findByIdAndDelete(id);
  }

  async getTagById(id: string): Promise<ITag | null> {
    return this.tagModel.findById(id).lean();
  }

  // 验证标签ID是否存在
  async validateTags(tags: string[]): Promise<boolean> {
    try {
      // 使用 name 字段查询而不是 _id
      const count = await this.tagModel.countDocuments({
        name: { $in: tags },
      });

      // 确保所有传入的标签都存在
      return count === tags.length;
    } catch (error) {
      console.error('Tag validation error:', error);
      return false;
    }
  }
}
