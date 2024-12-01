import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  NEW_CASE = 'new_case',
  NEW_ARTICLE = 'new_article',
}

@Schema({
  timestamps: true,
  versionKey: false,
  expireAfterSeconds: 60 * 60 * 24 * 7, // 7天后文档过期
})
export class Notification extends Document {
  @Prop({
    type: Types.ObjectId,
    required: true,
    // 消息接收者
  })
  receiverId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['admin_users', 'developer_users', 'enterprise_users'],
  })
  receiverCollection: string;

  @Prop({
    type: Types.ObjectId,
    required: true,
    // 触发消息的用户
  })
  senderId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['admin_users', 'developer_users', 'enterprise_users'],
  })
  senderCollection: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(NotificationType),
  })
  type: NotificationType;

  @Prop({
    type: Types.ObjectId,
    required: true,
    // 关联的内容ID（案例或文章）
  })
  contentId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  title: string; // 通知标题

  @Prop({
    type: String,
  })
  content?: string; // 通知内容

  @Prop({
    type: Boolean,
    default: false,
  })
  isRead: boolean; // 是否已读
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// 添加索引
NotificationSchema.index({ receiverId: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1 });
