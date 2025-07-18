import { Module } from '@nestjs/common';
import { MastraController } from './mastra.controller';
import { MastraService } from './mastra.service';

@Module({
  imports: [],
  controllers: [MastraController],
  providers: [MastraService],
  exports: [MastraService],
})
export class MastraModule {}
