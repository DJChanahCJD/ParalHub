import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  collection: 'article',
  timestamps: true,
})
export class Article extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Case' })
  caseId: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    refPath: 'authorModel',
  })
  authorId: string;

  @Prop({
    required: true,
    enum: ['AdminUser', 'DeveloperUser', 'EnterpriseUser'],
  })
  authorModel: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Tag' }],
    default: [],
  })
  tags: Types.ObjectId[];

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  commentsCount: number;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
// 添加全文搜索索引
ArticleSchema.index({ title: 'text', content: 'text' });
