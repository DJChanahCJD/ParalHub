import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Follow } from '../../schema/follow.schema';
import { Connection, Model, Types } from 'mongoose';

@Injectable()
export class FollowProvider {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<Follow>,
    @InjectConnection() private connection: Connection,
  ) {}

  // 获取关注列表（我关注的人）
  async getFollowing(
    userId: string,
    userCollection: string,
    current = 1,
    pageSize = 10,
    username?: string,
    sortField: string = 'createdAt',
    sortOrder: string = 'desc',
  ) {
    try {
      const validCurrent = Math.max(1, Number(current) || 1);
      const validPageSize = Math.max(1, Number(pageSize) || 10);
      const skip = (validCurrent - 1) * validPageSize;

      // 1. 获取关注记录并按集合分组
      const follows = await this.followModel
        .find({
          followerId: new Types.ObjectId(userId),
          followerCollection: userCollection,
        })
        .lean();

      if (!follows.length) {
        return { total: 0, data: [], hasMore: false, success: true };
      }

      // 2. 按集合分组，并保持关注关系的完整信息
      const followsByCollection = follows.reduce(
        (acc, follow) => {
          const collection = follow.followingCollection;
          if (!acc[collection]) {
            acc[collection] = [];
          }
          acc[collection].push({
            id: follow.followingId as Types.ObjectId,
            followId: follow._id as Types.ObjectId,
          });
          return acc;
        },
        {} as Record<
          string,
          Array<{ id: Types.ObjectId; followId: Types.ObjectId }>
        >,
      );

      // 3. 分别查询每个集合中的用户
      const collectionNames = Object.keys(followsByCollection);
      const userPromises = collectionNames.map(async (collection) => {
        const ids = followsByCollection[collection].map((f) => f.id);
        const filter: any = { _id: { $in: ids } };
        if (username) {
          filter.username = { $regex: username, $options: 'i' };
        }
        const users = await this.connection
          .collection(collection)
          .find(filter)
          .sort({ [sortField]: sortOrder === 'desc' ? -1 : 1 })
          .toArray();
        // 将 followId 关联到用户
        return users.map((user) => {
          const follow = followsByCollection[collection].find((f) =>
            f.id.equals(user._id),
          );
          return {
            _id: user._id,
            user: {
              ...user,
              collection,
            },
            followId: follow ? follow.followId : null,
            isFollowing: true,
          };
        });
      });

      const usersByCollection = await Promise.all(userPromises);
      const allUsers = usersByCollection.flat();

      // 4. 排序和分页
      allUsers.sort((a, b) => {
        if (sortOrder === 'desc') {
          return (
            new Date(b.user[sortField]).getTime() -
            new Date(a.user[sortField]).getTime()
          );
        } else {
          return (
            new Date(a.user[sortField]).getTime() -
            new Date(b.user[sortField]).getTime()
          );
        }
      });

      const paginatedUsers = allUsers.slice(skip, skip + validPageSize);

      const total = allUsers.length;

      return {
        total,
        data: paginatedUsers,
        hasMore: skip + paginatedUsers.length < total,
        current: validCurrent,
        success: true,
      };
    } catch (error) {
      console.error('Error in getFollowing:', error);
      throw error;
    }
  }

  // 获取粉丝列表（关注我的人）
  async getFollowers(
    userId: string,
    userCollection: string,
    current = 1,
    pageSize = 10,
    username?: string,
    sortField: string = 'createdAt',
    sortOrder: string = 'desc',
  ) {
    try {
      const validCurrent = Math.max(1, Number(current) || 1);
      const validPageSize = Math.max(1, Number(pageSize) || 10);
      const skip = (validCurrent - 1) * validPageSize;

      // 1. 获取所有粉丝记录并按集合分组
      const followers = await this.followModel
        .find({
          followingId: new Types.ObjectId(userId),
          followingCollection: userCollection,
        })
        .lean();

      if (!followers.length) {
        return { total: 0, data: [], hasMore: false, success: true };
      }

      // 2. 按集合分组粉丝记录
      const followersByCollection = followers.reduce(
        (acc, follow) => {
          const collection = follow.followerCollection;
          if (!acc[collection]) {
            acc[collection] = [];
          }
          acc[collection].push(follow.followerId);
          return acc;
        },
        {} as Record<string, Types.ObjectId[]>,
      );

      // 3. 分别查询每个集合中的粉丝用户
      const collectionNames = Object.keys(followersByCollection);
      const userPromises = collectionNames.map(async (collection) => {
        const ids = followersByCollection[collection];
        const filter: any = { _id: { $in: ids } };
        if (username) {
          filter.username = { $regex: username, $options: 'i' };
        }
        const users = await this.connection
          .collection(collection)
          .find(filter)
          .sort({ [sortField]: sortOrder === 'desc' ? -1 : 1 })
          .toArray();
        return users.map((user) => ({
          _id: user._id,
          user: {
            ...user,
            collection,
          },
          isFollowing: false, // 默认值，后续会更新
        }));
      });

      const usersByCollection = await Promise.all(userPromises);
      let allUsers = usersByCollection.flat();

      // 4. 查询当前用户是否关注了这些粉丝
      const followerIds = allUsers.map((user) => user._id);
      const followStatus = await this.followModel
        .find({
          followerId: new Types.ObjectId(userId),
          followerCollection: userCollection,
          followingId: { $in: followerIds },
        })
        .select('followingId')
        .lean();

      const followingSet = new Set(
        followStatus.map((f) => f.followingId.toString()),
      );

      // 更新 isFollowing 状态
      allUsers = allUsers.map((user) => ({
        ...user,
        isFollowing: followingSet.has(user._id.toString()),
      }));

      // 5. 排序和分页
      allUsers.sort((a, b) => {
        if (sortOrder === 'desc') {
          return (
            new Date(b.user[sortField]).getTime() -
            new Date(a.user[sortField]).getTime()
          );
        } else {
          return (
            new Date(a.user[sortField]).getTime() -
            new Date(b.user[sortField]).getTime()
          );
        }
      });

      const paginatedUsers = allUsers.slice(skip, skip + validPageSize);

      const total = allUsers.length;

      return {
        total,
        data: paginatedUsers,
        hasMore: skip + paginatedUsers.length < total,
        current: validCurrent,
        success: true,
      };
    } catch (error) {
      console.error('Error in getFollowers:', error);
      throw error;
    }
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.followModel.findOne({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
    });
    return follow ? true : false;
  }
  // 关注用户
  async follow(
    followerId: string,
    followerCollection: string,
    followingId: string,
    followingCollection: string,
  ) {
    try {
      // 1. 创建关注关系
      await this.followModel.create({
        followerId: new Types.ObjectId(followerId),
        followerCollection,
        followingId: new Types.ObjectId(followingId),
        followingCollection,
      });

      // 2. 更新计数器（使用原子操作）
      await this.connection
        .collection(followerCollection)
        .updateOne(
          { _id: new Types.ObjectId(followerId) },
          { $inc: { followingCount: 1 } },
        );

      await this.connection
        .collection(followingCollection)
        .updateOne(
          { _id: new Types.ObjectId(followingId) },
          { $inc: { followerCount: 1 } },
        );

      return { success: true };
    } catch (error) {
      // 如果是重复关注，返回特定错误
      if (error.code === 11000) {
        throw new Error('已经关注过该用户');
      }
      throw error;
    }
  }

  // 取消关注
  async unfollow(
    followerId: string,
    followerCollection: string,
    followingId: string,
    followingCollection: string,
  ) {
    try {
      // 1. 删除关注关系
      const result = await this.followModel.deleteOne({
        followerId: new Types.ObjectId(followerId),
        followerCollection,
        followingId: new Types.ObjectId(followingId),
        followingCollection,
      });

      if (result.deletedCount === 0) {
        throw new Error('未关注该用户');
      }

      // 2. 更新计数器
      await this.connection
        .collection(followerCollection)
        .updateOne(
          { _id: new Types.ObjectId(followerId) },
          { $inc: { followingCount: -1 } },
        );

      await this.connection
        .collection(followingCollection)
        .updateOne(
          { _id: new Types.ObjectId(followingId) },
          { $inc: { followerCount: -1 } },
        );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}
