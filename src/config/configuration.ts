export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'trade-manage-backend',

  // API Configuration
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // AWS Configuration
  aws: {
    region:
      process.env.APP_AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1',
  },

  // S3 Configuration
  s3: {
    bucketName: process.env.S3_BUCKET_NAME,
    region: process.env.S3_REGION || 'ap-southeast-1',
  },

  // Cognito Configuration
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    region: process.env.COGNITO_REGION || 'ap-southeast-1',
  },

  // DynamoDB Configuration
  dynamodb: {
    region: process.env.DYNAMODB_REGION || 'ap-southeast-1',
    tablePrefix: process.env.DYNAMODB_TABLE_PREFIX || 'trade-manage-dev',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Database Tables
  database: {
    tables: {
      users: process.env.DB_TABLE_USERS || 'users',
      trades: process.env.DB_TABLE_TRADES || 'trades',
      files: process.env.DB_TABLE_FILES || 'files',
      customers: process.env.DB_TABLE_CUSTOMERS || 'customers',
      products: process.env.DB_TABLE_PRODUCTS || 'products',
      customerProductTransactions:
        process.env.DB_TABLE_CUSTOMER_PRODUCT_TRANSACTIONS ||
        'customer-product-transactions',
    },
  },

  // Swagger Configuration
  swagger: {
    title: process.env.SWAGGER_TITLE || 'Trade Management API',
    description:
      process.env.SWAGGER_DESCRIPTION || 'API for Trade Management System',
    version: process.env.SWAGGER_VERSION || '1.0.0',
  },
});
