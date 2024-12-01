import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 明确设置环境
process.env.NODE_ENV = 'production';

// 加载环境变量
dotenv.config({
  path: path.resolve(__dirname, '..', '..', `.env.${process.env.NODE_ENV}`),
});

// 添加调试信息
console.log('当前环境：', process.env.NODE_ENV);
console.log(
  '配置文件路径：',
  path.resolve(__dirname, '..', '..', `.env.${process.env.NODE_ENV}`),
);

// 定义一个简单的测试模型
const TestSchema = new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now },
});

const Test = mongoose.model('Test', TestSchema);

async function testDB() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDB 连接成功！', process.env.MONGODB_URI);

    // 创建 (Create)
    const testDoc = await Test.create({
      name: '测试文档_' + new Date().toISOString(),
    });
    console.log('📝 创建文档成功：', testDoc);

    // 读取 (Read)
    const foundDoc = await Test.findById(testDoc._id);
    console.log('🔍 查找文档成功：', foundDoc);

    // 更新 (Update)
    const updatedDoc = await Test.findByIdAndUpdate(
      testDoc._id,
      { name: '已更新_' + new Date().toISOString() },
      { new: true },
    );
    console.log('📝 更新文档成功：', updatedDoc);

    // 删除 (Delete)
    const deletedDoc = await Test.findByIdAndDelete(testDoc._id);
    console.log('🗑️ 删除文档成功：', deletedDoc);

    // 清理测试集合
    await mongoose.connection.collections['tests'].drop();
    console.log('🧹 清理测试集合成功');
  } catch (error) {
    console.error('❌ 测试失败：', error);
  } finally {
    // 关闭连接
    await mongoose.disconnect();
    console.log('👋 连接已关闭');
  }
}

// 运行测试
testDB();
