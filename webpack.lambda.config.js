const path = require('path');
const webpack = require('webpack');

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
    // 可按需添加 alias 来屏蔽未使用的模块
    alias: {
      // 本项目未使用 microservices/websockets，忽略其解析
      '@nestjs/microservices': false,
      '@nestjs/websockets/socket-module': false,
      '@nestjs/websockets': false,
    },
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
  // 仅保留 swagger-ui-dist 为 external，以便在运行时读取其静态目录
  externals: ['swagger-ui-dist'],
  plugins: [
    // 忽略 Nest 可选依赖，避免打包时报错
    new webpack.IgnorePlugin({ resourceRegExp: /^@nestjs\/microservices$/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /^@nestjs\/websockets$/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /^@nestjs\/websockets\/socket-module$/ }),
    // class-transformer/storage 在某些路径被可选引用，若未用到可忽略
    new webpack.IgnorePlugin({ resourceRegExp: /^class-transformer\/storage$/ }),
  ],
};
