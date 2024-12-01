import { Global, Module } from '@nestjs/common';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: parseInt(config.get('MAIL_PORT')),
          secure: true,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"ParalHub" <${config.get('MAIL_USER')}>`,
        },
      }),
    }),
  ],
  providers: [
    {
      provide: 'MAILER_SERVICE',
      useFactory: (mailerService: MailerService) => {
        return mailerService;
      },
      inject: [MailerService],
    },
  ],
  exports: ['MAILER_SERVICE'],
})
export class MailModule {}
