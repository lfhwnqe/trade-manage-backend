# Gemini Context: Trade Management Backend

This document provides context for the AI assistant to understand and interact with this project.

## Project Overview

This is a backend application for a Trade Management system, built with the **NestJS** framework on **TypeScript**. It's designed for deployment on **AWS** and uses the **AWS CDK** for infrastructure as code.

The application is architected to run as a **serverless AWS Lambda function**, fronted by an **API Gateway**.

### Core Technologies

*   **Backend Framework:** NestJS
*   **Language:** TypeScript
*   **Infrastructure:** AWS CDK
*   **Database:** AWS DynamoDB
*   **Authentication:** AWS Cognito
*   **File Storage:** AWS S3

### Key Features & Modules

*   **Authentication (`/auth`):** JWT-based authentication and user management using AWS Cognito.
*   **Financial Modules (`/modules`):**
    *   Customer Management
    *   Financial Product Management
    *   Transaction/Purchase Management
*   **File Management (`/file`):** Secure file uploads to S3 using presigned URLs.
*   **Statistics (`/stats`):** Endpoints for data analytics.
*   **Shared Services (`/shared`):** Reusable services for interacting with AWS (S3, Cognito).

## Building and Running

### Local Development

To run the application on a local machine for development purposes:

```bash
# Start the development server with hot-reloading
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`, and Swagger documentation will be at `http://localhost:3000/api/v1/docs`.

### Deployment (AWS)

The application is packaged into a Lambda-compatible format and deployed using the AWS CDK.

```bash
# Deploy to the DEVELOPMENT environment
npm run deploy:dev

# Deploy to the PRODUCTION environment
npm run deploy:prod
```

These commands perform two main actions:
1.  `./scripts/build-lambda.sh`: Compiles the TypeScript code, packages it with production dependencies into the `lambda-package` directory.
2.  `cdk deploy`: Deploys the AWS resources defined in the `infrastructure` directory.

## Development Conventions

*   **Code Style:** The project uses **Prettier** for code formatting and **ESLint** for linting. These are enforced by a `pre-commit` hook managed by **Husky**.
*   **Commits:** While not explicitly defined, conventional commit messages are recommended.
*   **Configuration:** Environment-specific configuration is managed through `.env` files and the NestJS `ConfigModule`. The AWS CDK stack is responsible for injecting the necessary environment variables into the Lambda function.
*   **Testing:** The project is set up for unit and end-to-end testing with Jest.
    *   Run all tests: `npm run test`
    *   Run e2e tests: `npm run test:e2e`
*   **Infrastructure:** All AWS infrastructure is defined in `infrastructure/lib/trade-manage-stack.ts`. Any changes to AWS resources (DynamoDB tables, S3 buckets, etc.) should be made in this file.
