# Trade Management Backend

A modern NestJS backend application for trade management with AWS CDK deployment infrastructure.

## 🚀 Features

- **NestJS Framework**: Built with the latest NestJS framework for scalable server-side applications
- **AWS Integration**: Full integration with AWS services (S3, Cognito, DynamoDB)
- **Infrastructure as Code**: AWS CDK for infrastructure deployment and management
- **Multi-Environment Support**: Separate configurations for development and production
- **Authentication & Authorization**: JWT-based auth with AWS Cognito integration
- **File Management**: S3-based file storage with presigned URLs
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Type Safety**: Full TypeScript support with strict type checking
- **Testing**: Comprehensive unit and e2e testing setup
- **Code Quality**: ESLint, Prettier, and pre-commit hooks

## 🏗️ Architecture

```
├── src/
│   ├── auth/                 # Authentication module
│   ├── common/              # Shared decorators, filters, interceptors
│   ├── config/              # Configuration management
│   ├── database/            # DynamoDB service and configuration
│   ├── modules/             # Business logic modules
│   │   ├── user/           # User management
│   │   ├── trade/          # Trade management
│   │   └── file/           # File management
│   └── shared/             # Shared services (S3, Cognito)
├── infrastructure/         # AWS CDK infrastructure code
├── scripts/               # Deployment and development scripts
└── test/                 # Test files
```

## 🛠️ Prerequisites

- Node.js 18+
- npm or yarn
- AWS CLI configured
- AWS CDK CLI (`npm install -g aws-cdk`)

## 📦 Quick Start

### 1. Setup

```bash
# Clone and setup the project
git clone <repository-url>
cd trade-manage-backend

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Update .env with your AWS credentials and configuration
# Update .env.development and .env.production as needed
```

### 3. AWS Setup

```bash
# Configure AWS CLI (if not already done)
aws configure

# Bootstrap CDK (first time only)
cd infrastructure
cdk bootstrap
cd ..
```

### 4. Development

```bash
# Start development server
npm run start:dev
# or
./scripts/dev.sh start

# API will be available at: http://localhost:3000/api/v1
# Swagger docs at: http://localhost:3000/api/v1/docs
```

## 🚀 Deployment

### Development Environment

```bash
# Deploy to development
npm run deploy:dev
# or
./scripts/deploy.sh -e dev
```

### Production Environment

```bash
# Deploy to production
npm run deploy:prod
# or
./scripts/deploy.sh -e prod
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/api/v1/docs`
- **API Base URL**: `http://localhost:3000/api/v1`

### Main Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `GET /users/me` - Get current user info
- `POST /trades` - Create new trade
- `GET /trades` - List trades
- `POST /files/upload` - Upload file
- `GET /files` - List files

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

## 🔧 Development Scripts

```bash
# Development server with hot reload
npm run start:dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Development helper script
./scripts/dev.sh [start|test|lint|format|clean|reset|docs]
```

## 🏗️ AWS Services

### DynamoDB Tables
- **Users Table**: User profiles and authentication data
- **Trades Table**: Trading records and history
- **Files Table**: File metadata and references

### S3 Buckets
- **File Storage**: Secure file storage with presigned URLs
- **Versioning**: Enabled for data protection
- **Lifecycle Rules**: Automatic cleanup of incomplete uploads

### Cognito
- **User Pool**: User authentication and management
- **JWT Tokens**: Secure API access
- **Password Policies**: Configurable security requirements

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation with class-validator
- Helmet.js for security headers
- CORS configuration
- Environment-based secrets management

## 📁 Environment Variables

### Required Variables
```bash
# Application
NODE_ENV=development|production
PORT=3000
APP_NAME=trade-manage-backend

# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3
S3_BUCKET_NAME=your-bucket-name
S3_REGION=ap-southeast-1

# Cognito
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=ap-southeast-1

# DynamoDB
DYNAMODB_REGION=ap-southeast-1
DYNAMODB_TABLE_PREFIX=trade-manage-dev

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
```

## 🐛 Troubleshooting

### Common Issues

1. **AWS Credentials Not Found**
   ```bash
   aws configure
   # or set environment variables
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   ```

2. **CDK Bootstrap Required**
   ```bash
   cd infrastructure
   cdk bootstrap
   ```

3. **Port Already in Use**
   ```bash
   # Change PORT in .env file or kill existing process
   lsof -ti:3000 | xargs kill -9
   ```

4. **DynamoDB Connection Issues**
   - Verify AWS credentials
   - Check region configuration
   - Ensure tables are created via CDK deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review AWS documentation for service-specific issues

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - NestJS framework setup
  - AWS services integration
  - CDK infrastructure
  - Authentication system
  - File management
  - Trade management

---

**Built with ❤️ using NestJS and AWS**