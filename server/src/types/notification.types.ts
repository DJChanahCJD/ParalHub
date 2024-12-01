import { Types } from 'mongoose';

export interface NotificationSender {
  _id: Types.ObjectId;
  username: string;
  avatar: string;
}

export interface NotificationResponse {
  items: Array<{
    _id: Types.ObjectId;
    receiverId: string;
    receiverCollection: string;
    senderId: string;
    senderCollection: string;
    type: string;
    contentId: string;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
    sender: NotificationSender;
  }>;
  total: number;
  page: number;
  pageSize: number;
}
