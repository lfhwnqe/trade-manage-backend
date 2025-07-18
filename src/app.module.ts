import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { FileModule } from './modules/file/file.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { StatsModule } from './modules/stats/stats.module';
import { TypesModule } from './modules/types/types.module';
import { DatabaseModule } from './database/database.module';
import { SharedModule } from './shared/shared.module';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    SharedModule,
    AuthModule,
    UserModule,
    FileModule,
    CustomerModule,
    ProductModule,
    TransactionModule,
    StatsModule,
    ...(process.env.NODE_ENV === 'development' ? [TypesModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const exclusions: Parameters<MiddlewareConsumer['exclude']>[0][] = [
      // 认证相关路由
      { path: 'auth/login', method: RequestMethod.POST },
      { path: 'auth/register', method: RequestMethod.POST },
      { path: 'auth/verify-registration', method: RequestMethod.POST },
      // 应用基础路由
      { path: '', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      // API 文档路由
      { path: 'docs', method: RequestMethod.GET },
      { path: 'docs/(.*)', method: RequestMethod.GET },
    ];

    if (process.env.NODE_ENV === 'development') {
      exclusions.push({ path: 'types', method: RequestMethod.GET });
    }

    consumer.apply(AuthMiddleware).exclude(...exclusions).forRoutes('*');
  }
}
