import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  discriminatorKey: 'type',
  collection: 'comments',
})
export class BaseComment extends Document {
  @Prop({ required: true })
  content: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    refPath: 'userModel',
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['AdminUser', 'DeveloperUser', 'EnterpriseUser'],
  })
  userModel: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Article' })
  articleId: Types.ObjectId;

  @Prop({ default: 0 })
  likes: number;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        refPath: 'userModel',
      },
    ],
  })
  likedBy: Types.ObjectId[];

  type: 'comment' | 'reply';
}

@Schema()
export class Comment extends BaseComment {
  @Prop({ default: 0 })
  replyCount: number;
}

@Schema()
export class Reply extends BaseComment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Comment' })
  parentId: Types.ObjectId;

  @Prop({ required: false, type: Types.ObjectId, ref: 'Comment' })
  replyToId?: Types.ObjectId;

  @Prop({
    required: false,
    type: Types.ObjectId,
    refPath: 'userModel',
  })
  replyToUserId?: Types.ObjectId;
}

export const BaseCommentSchema = SchemaFactory.createForClass(BaseComment);
export const CommentSchema = SchemaFactory.createForClass(Comment);
export const ReplySchema = SchemaFactory.createForClass(Reply);
