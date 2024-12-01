import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Follow extends Document {
  @Prop({
    type: Types.ObjectId,
    required: true,
    // 这里不使用 ref，而是手动处理关联
  })
  followerId: Types.ObjectId; // 关注者ID

  @Prop({
    type: String,
    required: true,
    enum: ['admin_users', 'developer_users', 'enterprise_users'],
  })
  followerCollection: string; // 关注者所在集合

  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  followingId: Types.ObjectId; // 被关注者ID

  @Prop({
    type: String,
    required: true,
    enum: ['admin_users', 'developer_users', 'enterprise_users'],
  })
  followingCollection: string; // 被关注者所在集合
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

// 添加复合索引
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followerId: 1, createdAt: -1 });
FollowSchema.index({ followingId: 1, createdAt: -1 });
