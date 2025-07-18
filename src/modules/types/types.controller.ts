import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TypesService } from './types.service';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Types')
@Controller('types')
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get TypeScript interfaces for all API responses' })
  getTypes(): Promise<string> {
    return this.typesService.generateTypes();
  }
}
