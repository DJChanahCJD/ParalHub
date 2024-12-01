import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// 定义基础接口
export interface ISkill {
  _id: Types.ObjectId;
  name: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface IIndustry {
  _id: Types.ObjectId;
  name: string;
  updatedAt: Date;
  createdAt: Date;
}

// Schema 定义
@Schema({
  collection: 'skills',
  versionKey: false,
  timestamps: true,
})
export class Skill implements ISkill {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  updatedAt: Date;

  @Prop()
  createdAt: Date;
}

@Schema({
  collection: 'industries',
  versionKey: false,
  timestamps: true,
})
export class Industry implements IIndustry {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  updatedAt: Date;

  @Prop()
  createdAt: Date;
}

// 创建 Schema
export const SkillSchema = SchemaFactory.createForClass(Skill);
export const IndustrySchema = SchemaFactory.createForClass(Industry);

// 定义文档类型
export type SkillDocument = Skill & Document;
export type IndustryDocument = Industry & Document;

// 添加日志相关的类型定义
export interface UserLogSchema {
  id?: number;
  time: Date;
  event: string; // 事件类型
  platform: string; // 操作平台
  address: string; // 操作地址
  ip: string; // IP地址
  success: boolean; // 操作是否成功
  userId?: number; // 关联用户ID
  metadata?: Record<string, any>; // 额外元数据
}

// 日志查询参数接口
export interface LogQueryParams {
  page: number; // 当前页码
  pageSize: number; // 每页条数
  startTime?: Date; // 开始时间
  endTime?: Date; // 结束时间
  event?: string; // 事件类型
  success?: boolean; // 是否成功
  ip?: string; // IP地址
  address?: string; // 操作地址
}

// 添加标签接口
export interface ITag {
  _id: Types.ObjectId;
  name: string;
  updatedAt: Date;
  createdAt: Date;
}

// 添加标签 Schema
@Schema({
  collection: 'tags',
  versionKey: false,
  timestamps: true,
})
export class Tag implements ITag {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  updatedAt: Date;

  @Prop()
  createdAt: Date;
}

// 导出 Schema
export const TagSchema = SchemaFactory.createForClass(Tag);
export type TagDocument = Tag & Document;
