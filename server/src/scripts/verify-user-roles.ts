import { NestFactory } from '@nestjs/core';
import { MigrationModule } from './migration.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

async function verifyRoles() {
  try {
    const app = await NestFactory.createApplicationContext(MigrationModule);
    const connection = app.get<Connection>(getConnectionToken());

    console.log('开始验证用户角色...');

    // 检查每个集合
    const collections = ['admin_users', 'developer_users', 'enterprise_users'];

    for (const collection of collections) {
      // 检查缺失角色的用户
      const missingRoles = await connection
        .collection(collection)
        .find({
          role: { $exists: false },
        })
        .toArray();

      // 检查角色值不正确的用户
      const expectedRole = collection.replace('_users', '');
      const incorrectRoles = await connection
        .collection(collection)
        .find({
          role: { $exists: true, $ne: expectedRole },
        })
        .toArray();

      console.log(`\n${collection} 检查结果：`);
      console.log(`- 缺失角色的用户数：${missingRoles.length}`);
      console.log(`- 角色值不正确的用户数：${incorrectRoles.length}`);

      if (missingRoles.length > 0) {
        console.log(
          '缺失角色的用户 ID：',
          missingRoles.map((user) => user._id),
        );
      }
      if (incorrectRoles.length > 0) {
        console.log(
          '角色值不正确的用户：',
          incorrectRoles.map((user) => ({
            id: user._id,
            role: user.role,
          })),
        );
      }
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('验证过程中发生错误：', error);
    process.exit(1);
  }
}

verifyRoles();
