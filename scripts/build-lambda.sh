#!/bin/bash

# Build script for Lambda deployment
set -e

echo "🚀 Building Lambda function..."

# Clean previous lambda build (keep dist for development)
echo "🧹 Cleaning previous Lambda build..."
rm -rf lambda-package

# Create lambda package directory first
echo "📁 Creating Lambda package directory..."
mkdir -p lambda-package

# Build the application to temporary build directory
echo "📦 Building NestJS application for Lambda..."
# Use a temporary build directory to avoid affecting development dist
TEMP_BUILD_DIR="lambda-temp-build"
rm -rf $TEMP_BUILD_DIR

# Build with TypeScript compiler directly
echo "🔨 Compiling TypeScript files..."
npx tsc -p tsconfig.lambda.json

# Build lambda handler directly to lambda-package
echo "📦 Building Lambda handler..."
npx webpack --config webpack.lambda.config.js

# Copy built NestJS files to lambda-package
echo "📋 Copying built NestJS files..."
cp -r $TEMP_BUILD_DIR/* lambda-package/

# Clean up temporary build directory
echo "🧹 Cleaning up temporary build files..."
rm -rf $TEMP_BUILD_DIR

# Copy package.json and install production dependencies
echo "📦 Installing production dependencies..."
cp package.json lambda-package/
cd lambda-package

# Install only production dependencies without running postinstall scripts
HUSKY=0 npm install --only=production --no-package-lock --ignore-scripts

# Remove unnecessary files to reduce package size
echo "🗑️  Removing unnecessary files..."
find . -name "*.map" -delete
find . -name "*.ts" -delete
find . -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.test.js" -delete
find . -name "*.spec.js" -delete

# Remove dev dependencies that might have been installed
rm -rf node_modules/@types
rm -rf node_modules/typescript
rm -rf node_modules/ts-node
rm -rf node_modules/jest
rm -rf node_modules/@jest
rm -rf node_modules/eslint
rm -rf node_modules/@typescript-eslint
rm -rf node_modules/prettier

cd ..

echo "✅ Lambda package built successfully in lambda-package/"
echo "📊 Package size:"
du -sh lambda-package/

echo "🎯 Ready for CDK deployment!"
