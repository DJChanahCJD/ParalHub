import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  collection: 'case',
  timestamps: true,
})
export class Case extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 0 })
  stars: number;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Tag' }],
    default: [],
  })
  tags: Types.ObjectId[];

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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Article' }] })
  articleIds: string[];

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const CaseSchema = SchemaFactory.createForClass(Case);

// 添加全文搜索索引
CaseSchema.index({ title: 'text', description: 'text', content: 'text' });
