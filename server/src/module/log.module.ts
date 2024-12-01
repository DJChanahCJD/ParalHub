import { Module } from '@nestjs/common';
import { LogController } from 'src/controller/log.controller';
import { LoggingInterceptor } from 'src/provider/log/logging.interceptor';
import { LogService } from 'src/provider/log/log.service';
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
