import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const isDevelopment = configService.get('NODE_ENV') === 'development';

        // 根据环境创建不同的配置
        const client = isDevelopment
          ? createClient({
              socket: {
                host: 'localhost',
                port: 6379,
              },
            })
          : createClient({
              password: configService.get('REDIS_PASSWORD'),
              socket: {
                host: configService.get('REDIS_HOST'),
                port: configService.get('REDIS_PORT'),
              },
            });

        await client.connect();

        client.on('error', (err) => {
          console.log(
            `Redis Client Error: ${isDevelopment ? '开发环境' : '生产环境'}`,
            err,
          );
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const env = this.configService.get('NODE_ENV');
    console.log(`Redis Module initialized in ${env} mode`);
  }
}
