import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExportService } from './export.service';

// 标记为全局模块，方便其他模块直接注入使用
@Global()
@Module({
  imports: [ConfigModule],
  providers: [ExportService],
  exports: [ExportService],
})
export class ImportExportModule {}
