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

echo "📦 Building Lambda bundle (webpack)..."
npx webpack --config webpack.lambda.config.js

# 仅复制 swagger-ui-dist 静态资源（其被 external 化）
echo "📦 Adding swagger-ui-dist assets..."
mkdir -p lambda-package/node_modules
cp -R node_modules/swagger-ui-dist lambda-package/node_modules/swagger-ui-dist

# 清理无关文件，减小体积
echo "🗑️  Removing unnecessary files..."
find lambda-package -name "*.map" -delete || true
find lambda-package -name "*.ts" -delete || true
find lambda-package -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find lambda-package -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find lambda-package -name "*.test.js" -delete || true
find lambda-package -name "*.spec.js" -delete || true

# 移除常见 dev 依赖
# 由于只复制了 swagger-ui-dist，此处无需删除 node_modules 中的 dev 依赖

echo "✅ Lambda package built successfully in lambda-package/"
echo "📊 Package size:"
du -sh lambda-package/

echo "🎯 Ready for CDK deployment!"
