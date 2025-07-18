import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { TypesService, TypesResponse } from './types.service';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Types')
@Controller('types')
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get structured type definitions for all API schemas',
    description:
      'Returns a structured representation of all TypeScript interfaces and types derived from the API documentation',
  })
  @ApiResponse({
    status: 200,
    description: 'Type definitions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            types: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'CreateUserDto' },
                  type: {
                    type: 'string',
                    enum: ['interface', 'enum', 'type'],
                    example: 'interface',
                  },
                  properties: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        type: { type: 'string', example: 'string' },
                        required: { type: 'boolean', example: true },
                        description: {
                          type: 'string',
                          example: 'User email address',
                        },
                      },
                    },
                  },
                  description: {
                    type: 'string',
                    example: 'Data transfer object for creating a user',
                  },
                },
              },
            },
            totalCount: { type: 'number', example: 25 },
            generatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-07-18T03:13:59.973Z',
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during type generation',
  })
  getTypes(): Promise<TypesResponse> {
    return this.typesService.generateTypes();
  }
}
