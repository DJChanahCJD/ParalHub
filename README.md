# ParalHub

ParalHub 是一个全栈项目，包含三个子项目：

- `admin/`: 管理后台
- `web/`: 前台网站
- `server/`: 后端服务

## 部署

### 后端 (server)
后端服务部署在 Vercel，使用 MongoDB Atlas 和 Redis Cloud。

### 管理后台 (admin)
管理后台使用 Ant Design Pro，部署在 Vercel。

### 前台网站 (web)
前台网站使用 Next.js，部署在 Vercel。

## 开发

安装依赖

```bash
cd admin && npm install
cd website && npm install
cd server && npm install
```

开发环境运行

后端

```bash
cd server && npm run start:dev
```

管理后台

```bash
cd admin && npm run dev
```

前台网站

```bash
cd website && npm run dev
```
