import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MastraService } from './mastra.service';

@ApiTags('Mastra')
@Controller('mastra')
export class MastraController {
  constructor(private readonly mastraService: MastraService) {}

  @Post('greet')
  @ApiOperation({ summary: 'Run greet workflow using Kimi model' })
  async greet(@Body('name') name: string) {
    return { reply: await this.mastraService.greet(name) };
  }
}
