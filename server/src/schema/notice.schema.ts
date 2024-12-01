import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AdminUser } from './users.schema';

export type NoticeDocument = Notice & Document;

@Schema({
  collection: 'notice',
  timestamps: true,
  expireAfterSeconds: 60 * 60 * 24 * 90, // 90天未更新自动删除
})
export class Notice {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    required: true,
    enum: ['system', 'announcement', 'notification'],
    default: 'announcement',
  })
  type: string;

  @Prop({
    required: true,
    enum: ['draft', 'published', 'expired'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: Date })
  publishTime?: Date;

  @Prop({ type: Date })
  expireTime?: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'AdminUser' })
  creatorId: Types.ObjectId;

  creator: AdminUser;
  @Prop({
    required: true,
    enum: ['all', 'enterprise', 'developer'],
    default: 'all',
  })
  target: string;
}

export const NoticeSchema = SchemaFactory.createForClass(Notice);
