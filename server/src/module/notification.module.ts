import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from '../provider/notification/notification.service';
import {
  Notification,
  NotificationSchema,
} from '../schema/notification.schema';
import { Follow, FollowSchema } from '../schema/follow.schema';
import { FollowProvider } from '../provider/follow/follow.provider';
import { NotificationController } from '../controller/notification.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Follow.name, schema: FollowSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, FollowProvider],
  exports: [NotificationService],
})
export class NotificationModule {}
