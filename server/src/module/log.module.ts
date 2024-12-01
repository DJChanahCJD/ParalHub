import { Module } from '@nestjs/common';
import { LogController } from '../controller/log.controller';
import { LoggingInterceptor } from '../provider/log/logging.interceptor';
import { LogService } from '../provider/log/log.service';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  controllers: [LogController],
  providers: [
    LogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [LogService],
})
export class LogModule {}
