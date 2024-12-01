import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { defaultAvatarUrl } from '@utils/avatar';
// 定义角色枚举
export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  ENTERPRISE = 'enterprise',
}

// 基础用户类
@Schema({
  timestamps: true,
  versionKey: false,
  discriminatorKey: 'role',
})
export abstract class BaseUser extends Document {
  // 显式声明 _id 字段,用于文档唯一标识
  _id: Types.ObjectId;

  @Prop({
    index: true,
    validate: {
      validator: async function (username: string) {
        if (!username) return true; // 如果没有用户名，跳过验证

        const collections = [
          'admin_users',
          'developer_users',
          'enterprise_users',
        ];
        const currentCollection = this.collection.name;

        for (const collection of collections) {
          if (collection === currentCollection) continue;

          const count = await this.db
            .collection(collection)
            .countDocuments({ username });
          if (count > 0) return false;
        }
        return true;
      },
      message: '用户名已被使用',
    },
  })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ sparse: true, unique: true })
  phone?: string;

  @Prop({ required: true, select: false }) // select: false 表示在查询时默认不返回该字段,除非显式指定
  password: string;

  @Prop({
    default: function () {
      // 可以根据用户名生成不同的默认头像
      return defaultAvatarUrl(this.username);
    },
  })
  avatar: string;

  @Prop()
  lastLogin?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({
    type: String,
    enum: UserRole,
    required: true,
  })
  role: UserRole;

  @Prop()
  website?: string;

  @Prop()
  company?: string;

  @Prop({ maxlength: 1024 })
  bio?: string;

  @Prop({
    type: [Types.ObjectId], // 存储案例ID数组
    ref: 'Case', // 关联到 Case 集合
    default: [], // 默认为空数组
  })
  starIds: Types.ObjectId[];

  @Prop({
    type: [Types.ObjectId], // 存储关注用户ID数组
    ref: 'BaseUser', // 关联到 User 集合
    default: [], // 默认为空数组
  })
  followUserIds: Types.ObjectId[];

  @Prop({
    type: Number,
    default: 0,
  })
  followingCount: number; // 关注数量

  @Prop({
    type: Number,
    default: 0,
  })
  followerCount: number; // 粉丝数量

  @Prop({
    type: [Types.ObjectId], // 存储文章ID数组
    ref: 'Article', // 关联到 Article 集合
    default: [], // 默认为空数组
  })
  likedArticleIds: Types.ObjectId[];
}

// 只有超级管理员可以进行读写管理，因此无需设置版本键
// 管理员
@Schema({
  collection: 'admin_users',
})
export class AdminUser extends BaseUser {
  @Prop({
    type: String,
    enum: ['super_admin', 'admin'],
    default: 'admin',
  })
  access: string;

  @Prop({
    type: String,
    default: UserRole.ADMIN,
    required: true,
  })
  role: UserRole.ADMIN;
}

// 开发者
@Schema({
  collection: 'developer_users',
})
export class DeveloperUser extends BaseUser {
  @Prop()
  realName?: string;

  @Prop({
    type: [String],
    ref: 'Skill',
    validate: {
      validator: function (skills: string[]) {
        // 基础验证：确保至少有一个技能
        if (!skills || skills.length === 0) return false;
        return true;
      },
      message: '请至少选择一个技能',
    },
    required: [true, '技能是必填项'],
  })
  skills: string[];

  @Prop({
    type: String,
    default: UserRole.DEVELOPER,
    required: true,
  })
  role: UserRole.DEVELOPER;
}

// 企业
@Schema({
  collection: 'enterprise_users',
})
export class EnterpriseUser extends BaseUser {
  @Prop()
  industry?: string;

  @Prop({
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  })
  verificationStatus: string;

  @Prop({ default: 0 })
  caseCount: number;

  @Prop({
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'small',
  })
  scale?: string;

  @Prop()
  contactPerson?: string;

  @Prop()
  address?: string;

  @Prop({ required: true })
  company: string;

  @Prop({
    type: String,
    default: UserRole.ENTERPRISE,
    required: true,
  })
  role: UserRole.ENTERPRISE;
}

const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
const DeveloperUserSchema = SchemaFactory.createForClass(DeveloperUser);
const EnterpriseUserSchema = SchemaFactory.createForClass(EnterpriseUser);

// 为 phone 字段添加部分索引
AdminUserSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $exists: true } } },
);
DeveloperUserSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $exists: true } } },
);
EnterpriseUserSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $exists: true } } },
);

// 为每个 Schema 添加跨集合唯一索引
[AdminUserSchema, DeveloperUserSchema, EnterpriseUserSchema].forEach(
  (schema) => {
    schema.index(
      { username: 1 },
      {
        unique: true,
        partialFilterExpression: { username: { $exists: true } },
        collation: { locale: 'en', strength: 2 },
        sparse: true,
      },
    );
  },
);

export { AdminUserSchema, DeveloperUserSchema, EnterpriseUserSchema };
