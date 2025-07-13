const path = require('path');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: './src/lambda.ts',
  output: {
    path: path.resolve(__dirname, 'lambda-package'),
    filename: 'lambda.js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: [
    // Mark all node_modules as external to reduce bundle size
    /^@nestjs\//,
    /^@aws-sdk\//,
    /^aws-sdk/,
    'aws-lambda',
    '@vendia/serverless-express',
    'helmet',
    'compression',
    'cors',
    'bcryptjs',
    'express',
    'multer',
    'passport',
    'passport-jwt',
    'passport-local',
    'jsonwebtoken',
    'uuid',
    'class-validator',
    'class-transformer',
    'reflect-metadata',
    'rxjs',
    'dotenv',
    'swagger-ui-dist',
  ],
};
