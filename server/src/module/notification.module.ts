import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from 'src/provider/notification/notification.service';
import {
  Notification,
  NotificationSchema,
} from 'src/schema/notification.schema';
import { Follow, FollowSchema } from 'src/schema/follow.schema';
import { FollowProvider } from 'src/provider/follow/follow.provider';
import { NotificationController } from 'src/controller/notification.controller';

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
