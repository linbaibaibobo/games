# Global Shop Mall - 全球购物商城

一个面向外国消费者的多语言个体户购物商城，支持卖家商品管理、买家收藏/购物车功能、多种支付方式。

## 功能特性

### 多语言支持
- 英语 (English)
- 中文 (简体中文)
- 日语 (日本語)
- 韩语 (한국어)
- 俄语 (Русский)

### 用户系统
- 邮箱注册/登录
- 买家/卖家角色选择
- 个人资料管理
- 密码修改

### 买家功能
- 浏览商品（支持分类筛选、搜索、排序）
- 商品收藏
- 购物车管理
- 订单管理
- 查看订单状态

### 卖家功能
- 商品上架（支持多语言名称和描述）
- 商品编辑/删除
- 库存管理
- 订单管理
- 销售统计

### 支付方式
- Visa/Mastercard
- 微信支付
- 支付宝
- Apple Pay

### 设计风格
- 清新自然的橙色主题
- 响应式设计，支持移动端
- 简洁直观的用户界面

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- SQLite 数据库
- JWT 认证
- Multer 文件上传

### 前端
- React 18
- TypeScript
- Tailwind CSS
- React Query
- Zustand 状态管理
- React Router
- i18next 国际化

## 项目结构

```
/workspace/
├── server/                 # 后端代码
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── middleware/    # 中间件
│   │   ├── database.ts    # 数据库配置
│   │   └── index.ts       # 入口文件
│   ├── uploads/           # 上传文件目录
│   └── package.json
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── store/         # 状态管理
│   │   ├── lib/           # 工具函数
│   │   ├── i18n/          # 国际化配置
│   │   └── App.tsx        # 主应用
│   └── package.json
└── package.json           # 根目录配置
```

## 启动项目

### 开发模式（同时启动前后端）
```bash
npm run dev
```

### 单独启动后端
```bash
cd server && npm run dev
```

### 单独启动前端
```bash
cd client && npm run dev
```

## 默认端口
- 后端 API: http://localhost:3001
- 前端应用: http://localhost:3000

## 使用说明

1. 注册账号时选择"买家"或"卖家"角色
2. 卖家可以在"卖家中心"管理商品和订单
3. 买家可以浏览商品、添加到购物车、收藏商品
4. 支持多语言切换，系统会自动检测浏览器语言
5. 结账时支持多种支付方式

## 注意事项

- 首次启动时会自动创建 SQLite 数据库
- 上传的商品图片保存在 `server/uploads/` 目录
- 支付功能为模拟实现，实际部署时需要接入真实支付网关
