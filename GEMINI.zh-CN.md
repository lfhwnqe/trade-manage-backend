# Gemini 上下文：交易管理后端

本文档为 AI 助手提供了理解和与该项目互动的上下文。

## 项目概述

这是一个用于交易管理系统的后端应用程序，使用 **NestJS** 框架和 **TypeScript** 构建。它被设计用于在 **AWS** 上部署，并使用 **AWS CDK** 进行基础设施即代码的管理。

该应用程序的架构是作为一个**无服务器 AWS Lambda 函数**运行，并由 **API Gateway** 提供前端入口。

### 核心技术

*   **后端框架:** NestJS
*   **开发语言:** TypeScript
*   **基础设施:** AWS CDK
*   **数据库:** AWS DynamoDB
*   **身份认证:** AWS Cognito
*   **文件存储:** AWS S3

### 主要功能和模块

*   **身份认证 (`/auth`):** 基于 JWT，使用 AWS Cognito 进行身份验证和用户管理。
*   **金融模块 (`/modules`):**
    *   客户管理
    *   金融产品管理
    *   交易/购买管理
*   **文件管理 (`/file`):** 使用预签名 URL 安全地将文件上传到 S3。
*   **统计 (`/stats`):** 用于数据分析的端点。
*   **共享服务 (`/shared`):** 用于与 AWS (S3, Cognito) 交互的可复用服务。

## 构建与运行

### 本地开发

要在本地机器上运行应用程序以进行开发：

```bash
# 启动开发服务器并启用热重载
npm run start:dev
```

API 将在 `http://localhost:3000/api/v1` 上可用，Swagger 文档将在 `http://localhost:3000/api/v1/docs` 上可用。

### 部署 (AWS)

应用程序被打包成与 Lambda 兼容的格式，并使用 AWS CDK 进行部署。

```bash
# 部署到 DEVELOPMENT (开发) 环境
npm run deploy:dev

# 部署到 PRODUCTION (生产) 环境
npm run deploy:prod
```

这些命令主要执行两个操作：
1.  `./scripts/build-lambda.sh`: 编译 TypeScript 代码，并将其与生产依赖项一起打包到 `lambda-package` 目录中。
2.  `cdk deploy`: 部署在 `infrastructure` 目录中定义的 AWS 资源。

## 开发规范

*   **代码风格:** 项目使用 **Prettier** 进行代码格式化，使用 **ESLint** 进行代码检查。这些规范由 **Husky** 管理的 `pre-commit` 钩子强制执行。
*   **提交规范:** 虽然没有明确定义，但建议使用语义化提交信息 (Conventional Commits)。
*   **配置管理:** 特定于环境的配置通过 `.env` 文件和 NestJS 的 `ConfigModule` 进行管理。AWS CDK 堆栈负责将必要的环境变量注入到 Lambda 函数中。
*   **测试:** 项目已配置好使用 Jest 进行单元测试和端到端测试。
    *   运行所有测试: `npm run test`
    *   运行端到端测试: `npm run test:e2e`
*   **基础设施:** 所有的 AWS 基础设施都在 `infrastructure/lib/trade-manage-stack.ts` 文件中定义。任何对 AWS 资源（如 DynamoDB 表、S3 存储桶等）的更改都应在此文件中进行。
