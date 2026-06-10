# 智能学习笔记系统

AI摘要 + 知识图谱 + 艾宾浩斯复习计划

## 项目结构

```
notebook/
├── backend/                    # Express 后端
│   ├── src/
│   │   ├── config/            # 数据库配置
│   │   ├── middleware/        # 认证中间件
│   │   ├── models/            # Sequelize 模型
│   │   ├── routes/           # API 路由
│   │   ├── services/         # AI服务、复习算法
│   │   └── index.js          # 入口文件
│   └── .env                   # 环境配置
├── frontend/                   # Vue 3 前端
│   ├── src/
│   │   ├── views/            # 页面组件
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── services/         # API 封装
│   │   └── router.js
│   └── vite.config.js
└── docs/
    └── database.sql          # 数据库设计
```

## 快速启动

### 1. 数据库初始化

```sql
mysql -u root -p < docs/database.sql
```

### 2. 后端启动

```bash
cd backend
npm install
# 配置 .env 中的数据库和AI API信息
npm start
```

### 3. 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5180

## 功能特性

- **AI摘要生成**：调用大模型API自动提取摘要和关键词
- **知识图谱可视化**：ECharts Force图展示笔记关联
- **艾宾浩斯复习**：SM-2算法驱动的间隔复习计划
- **富文本编辑**：TipTap编辑器支持Markdown
- **用户认证**：JWT登录注册

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Vite |
| 状态管理 | Pinia |
| 富文本 | TipTap |
| 可视化 | ECharts |
| 后端框架 | Express |
| 数据库 | MySQL + Sequelize |
| AI服务 | DeepSeek/文心一言 API |