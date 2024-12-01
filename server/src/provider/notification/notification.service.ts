import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import {
  Notification,
  NotificationType,
} from '../../schema/notification.schema';
import { FollowProvider } from '../../provider/follow/follow.provider';
import { NotificationResponse } from '../../types/notification.types';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectConnection() private connection: Connection,
    private followProvider: FollowProvider,
  ) {}

  // 创建新案例通知
  async createCaseNotification(
    authorId: string,
    authorCollection: string,
    caseId: string,
    caseTitle: string,
  ) {
    console.log(
      'query from notification service createCaseNotification: ',
      authorId,
      authorCollection,
      caseId,
      caseTitle,
    );
    // 使用 FollowProvider 获取粉丝列表
    const { data: followers } = await this.followProvider.getFollowers(
      authorId,
      authorCollection,
      1,
      1000, // 设置一个较大的数值以获取所有粉丝
    );

    console.log(
      'followers from notification service createCaseNotification',
      followers,
    );

    // 为每个粉丝创建通知
    const notifications = followers.map((follower) => ({
      receiverId: follower._id.toString(),
      receiverCollection: follower.user.collection,
      senderId: authorId,
      senderCollection: authorCollection,
      type: NotificationType.NEW_CASE,
      contentId: caseId,
      title: `新案例发布: ${caseTitle}`,
    }));

    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }
  }

  // 创建新文章通知
  async createArticleNotification(
    authorId: string,
    authorCollection: string,
    articleId: string,
    articleTitle: string,
    caseId: string,
  ) {
    console.log(
      'query from notification service createArticleNotification: ',
      authorId,
      authorCollection,
      articleId,
      articleTitle,
    );
    const { data: followers } = await this.followProvider.getFollowers(
      authorId,
      authorCollection,
      1,
      1000, // 设置一个较大的数值以获取所有粉丝
    );

    console.log(
      'followers from notification service createArticleNotification',
      followers,
    );

    const notifications = followers.map((follower) => ({
      receiverId: follower._id.toString(),
      receiverCollection: follower.user.collection,
      senderId: authorId,
      senderCollection: authorCollection,
      type: NotificationType.NEW_ARTICLE,
      contentId: `${caseId}:${articleId}`,
      title: `新文章发布: ${articleTitle}`,
    }));

    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }
  }

  // 获取用户的未读消息数
  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({
      receiverId: userId,
      isRead: false,
    });
  }

  // 获取用户的消息列表
  async getUserNotifications(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<NotificationResponse> {
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({ receiverId: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.notificationModel.countDocuments({ receiverId: userId }),
    ]);

    // 获取所有发送者的信息
    const senderPromises = notifications.map(async (notification) => {
      const sender = await this.connection
        .collection(notification.senderCollection)
        .findOne(
          { _id: new Types.ObjectId(notification.senderId) },
          { projection: { username: 1, avatar: 1 } },
        );

      return {
        ...notification,
        sender: {
          _id: sender._id,
          username: sender.username,
          avatar: sender.avatar,
        },
      };
    });

    const notificationsWithSender = await Promise.all(senderPromises);
    return {
      items:
        notificationsWithSender as unknown as NotificationResponse['items'],
      total,
      page,
      pageSize,
    };
  }

  // 标记消息为已读
  async markAsRead(userId: string, notificationId?: string) {
    if (notificationId) {
      // 标记单条消息为已读
      await this.notificationModel.updateOne(
        { _id: notificationId, receiverId: userId },
        { isRead: true },
      );
    } else {
      // 标记所有消息为已读
      await this.notificationModel.updateMany(
        { receiverId: userId },
        { isRead: true },
      );
    }
  }
}
