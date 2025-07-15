# 邮箱验证功能指南

## 概述

本项目现在支持基于AWS Cognito的用户注册邮箱验证功能。用户注册后需要通过邮箱收到的验证码来激活账户。

## 功能特性

- ✅ 用户注册时自动发送邮箱验证码
- ✅ 支持验证码验证接口
- ✅ 完整的错误处理和状态管理
- ✅ 与现有认证系统无缝集成
- ✅ 支持用户状态跟踪（待验证/已激活）

## API 端点

### 1. 用户注册 (更新)

**POST** `/api/v1/auth/register`

注册流程已更新，现在会：
1. 在AWS Cognito中创建用户
2. 自动发送邮箱验证码
3. 在DynamoDB中创建用户记录（状态为`pending_verification`）

**请求体**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "john_doe",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "emailVerified": false,
    "status": "pending_verification",
    "message": "Registration successful. Please check your email for verification code.",
    "requiresVerification": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 邮箱验证 (新增)

**POST** `/api/v1/auth/verify-registration`

验证用户注册时收到的邮箱验证码。

**请求体**:
```json
{
  "username": "john_doe",
  "verificationCode": "123456"
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "message": "Email verification successful",
    "verified": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**错误响应示例**:
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/verify-registration",
  "method": "POST",
  "message": "Invalid verification code"
}
```

## 错误处理

### 验证码相关错误

| 错误类型 | HTTP状态码 | 错误信息 |
|---------|-----------|---------|
| 验证码错误 | 400 | Invalid verification code |
| 验证码过期 | 400 | Verification code has expired |
| 用户不存在 | 400 | User not found |
| 用户已验证 | 409 | User is already verified |
| 尝试次数过多 | 400 | Too many attempts. Please try again later |

### 注册相关错误

| 错误类型 | HTTP状态码 | 错误信息 |
|---------|-----------|---------|
| 用户名已存在 | 409 | Username already exists |
| 密码不符合要求 | 400 | Password does not meet requirements |
| 参数无效 | 400 | Invalid registration parameters |

## 用户状态管理

### 用户状态说明

- `pending_verification`: 用户已注册但未验证邮箱
- `active`: 用户已验证邮箱，账户激活
- `inactive`: 账户被停用
- `suspended`: 账户被暂停

### DynamoDB用户记录结构

```json
{
  "userId": "john_doe",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "emailVerified": true,
  "status": "active",
  "cognitoUserSub": "cognito-user-id-123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 使用流程

### 完整的用户注册和验证流程

1. **用户注册**
   ```bash
   curl -X POST "http://localhost:3000/api/v1/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "john_doe",
       "email": "john@example.com",
       "password": "Password123!",
       "firstName": "John",
       "lastName": "Doe"
     }'
   ```

2. **检查邮箱**
   - 用户会收到来自AWS Cognito的验证邮件
   - 邮件包含6位数字验证码

3. **验证邮箱**
   ```bash
   curl -X POST "http://localhost:3000/api/v1/auth/verify-registration" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "john_doe",
       "verificationCode": "123456"
     }'
   ```

4. **登录使用**
   - 验证成功后，用户状态变为`active`
   - 可以正常登录和使用系统功能

## 配置要求

### AWS Cognito配置

确保在CDK配置中启用了邮箱验证：

```typescript
// infrastructure/lib/trade-manage-stack.ts
this.userPool = new cognito.UserPool(this, 'UserPool', {
  autoVerify: {
    email: true,  // 启用邮箱自动验证
  },
  // ... 其他配置
});
```

### 环境变量

```bash
# AWS Cognito配置
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=ap-southeast-1

# AWS凭证
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## 测试

### 运行自动化测试

```bash
# 运行单元测试
npm test auth.service.spec.ts

# 运行集成测试
node test-email-verification.js
```

### 手动测试步骤

1. 启动应用: `npm run start:dev`
2. 注册新用户
3. 检查邮箱获取验证码
4. 调用验证接口
5. 确认用户状态更新

## 监控和日志

### 日志记录

系统会记录以下关键事件：
- 用户注册尝试
- Cognito用户创建成功/失败
- 邮箱验证尝试
- 用户状态更新

### 监控指标

建议监控：
- 注册成功率
- 邮箱验证成功率
- 验证码错误率
- 用户激活时间

## 故障排除

### 常见问题

1. **收不到验证邮件**
   - 检查邮箱地址是否正确
   - 查看垃圾邮件文件夹
   - 确认AWS Cognito邮件配置

2. **验证码无效**
   - 确认验证码格式（6位数字）
   - 检查验证码是否过期（通常15分钟）
   - 确认用户名正确

3. **用户状态异常**
   - 检查DynamoDB中的用户记录
   - 确认Cognito中的用户状态
   - 查看应用日志

### 调试命令

```bash
# 检查应用健康状态
curl http://localhost:3000/api/v1/health

# 查看应用日志
npm run start:dev

# 运行测试脚本
node test-email-verification.js
```

## 安全考虑

- 验证码有时间限制（15分钟过期）
- 限制验证尝试次数防止暴力破解
- 所有敏感操作都有详细日志记录
- 使用HTTPS传输验证码
- 验证码只能使用一次
