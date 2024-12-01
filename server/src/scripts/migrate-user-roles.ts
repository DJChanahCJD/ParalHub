import { NestFactory } from '@nestjs/core';
import { MigrationModule } from './migration.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { UserRole } from '../schema/users.schema';

async function migrate() {
  try {
    // 使用 MigrationModule 而不是 AppModule
    const app = await NestFactory.createApplicationContext(MigrationModule);

    // 获取数据库连接
    const connection = app.get<Connection>(getConnectionToken());

    console.log('开始迁移用户角色...');

    // 更新管理员用户
    const adminResult = await connection
      .collection('admin_users')
      .updateMany(
        { role: { $exists: false } },
        { $set: { role: UserRole.ADMIN } },
      );
    console.log(`已更新 ${adminResult.modifiedCount} 个管理员用户`);

    // 更新开发者用户
    const devResult = await connection
      .collection('developer_users')
      .updateMany(
        { role: { $exists: false } },
        { $set: { role: UserRole.DEVELOPER } },
      );
    console.log(`已更新 ${devResult.modifiedCount} 个开发者用户`);

    // 更新企业用户
    const entResult = await connection
      .collection('enterprise_users')
      .updateMany(
        { role: { $exists: false } },
        { $set: { role: UserRole.ENTERPRISE } },
      );
    console.log(`已更新 ${entResult.modifiedCount} 个企业用户`);

    // 验证迁移结果
    const adminCount = await connection
      .collection('admin_users')
      .countDocuments({ role: { $exists: false } });
    const devCount = await connection
      .collection('developer_users')
      .countDocuments({ role: { $exists: false } });
    const entCount = await connection
      .collection('enterprise_users')
      .countDocuments({ role: { $exists: false } });

    if (adminCount === 0 && devCount === 0 && entCount === 0) {
      console.log('迁移成功完成！所有用户都已设置角色。');
    } else {
      console.warn('警告：仍有一些用户没有角色设置：');
      console.warn(`- 管理员用户：${adminCount}`);
      console.warn(`- 开发者用户：${devCount}`);
      console.warn(`- 企业用户：${entCount}`);
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('迁移过程中发生错误：', error);
    process.exit(1);
  }
}

migrate();
