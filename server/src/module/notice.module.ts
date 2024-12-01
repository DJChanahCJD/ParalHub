import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoticeController } from 'src/controller/notice.controller';
import { NoticeProvider } from 'src/provider/notice/notice.provider';
import { Notice, NoticeSchema } from 'src/schema/notice.schema';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notice.name, schema: NoticeSchema }]),
    AuthModule,
  ],
  controllers: [NoticeController],
  providers: [NoticeProvider],
  exports: [NoticeProvider],
})
export class NoticeModule {}
