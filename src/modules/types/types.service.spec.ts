import { Test, TestingModule } from '@nestjs/testing';
import { TypesService, TypeDefinition } from './types.service';
import { SwaggerDocumentService } from '@/shared/services/swagger-document.service';
import { OpenAPIObject } from '@nestjs/swagger';

describe('TypesService', () => {
  let service: TypesService;
  let swaggerService: SwaggerDocumentService;

  const mockSwaggerDocument: OpenAPIObject = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email'],
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
              example: 'user-123',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'moderator'],
              description: 'User role',
              example: 'user',
            },
          },
        },
        UserRole: {
          type: 'string',
          enum: ['admin', 'user', 'moderator'],
          description: 'Available user roles',
        },
        CreateUserDto: {
          type: 'object',
          required: ['email', 'name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            role: {
              $ref: '#/components/schemas/UserRole',
            },
          },
        },
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypesService,
        {
          provide: SwaggerDocumentService,
          useValue: {
            getDocument: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TypesService>(TypesService);
    swaggerService = module.get<SwaggerDocumentService>(SwaggerDocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTypes', () => {
    it('should return empty types when no document is available', async () => {
      jest.spyOn(swaggerService, 'getDocument').mockReturnValue(null);

      const result = await service.generateTypes();

      expect(result).toEqual({
        types: [],
        totalCount: 0,
        generatedAt: expect.any(String),
      });
    });

    it('should generate types from swagger document', async () => {
      jest
        .spyOn(swaggerService, 'getDocument')
        .mockReturnValue(mockSwaggerDocument);

      const result = await service.generateTypes();

      expect(result.types).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.generatedAt).toBeDefined();

      // Check User interface
      const userType = result.types.find((t) => t.name === 'User');
      expect(userType).toBeDefined();
      expect(userType?.type).toBe('interface');
      expect(userType?.properties).toBeDefined();
      expect(userType?.properties?.id).toEqual({
        type: 'string',
        required: true,
        description: 'User ID',
        example: 'user-123',
      });
      expect(userType?.properties?.email).toEqual({
        type: 'string',
        required: true,
        description: 'User email address',
        format: 'email',
        example: 'user@example.com',
      });
      expect(userType?.properties?.name).toEqual({
        type: 'string',
        required: false,
        description: 'User full name',
        example: 'John Doe',
      });

      // Check UserRole enum
      const roleType = result.types.find((t) => t.name === 'UserRole');
      expect(roleType).toBeDefined();
      expect(roleType?.type).toBe('enum');
      expect(roleType?.values).toEqual(['admin', 'user', 'moderator']);

      // Check CreateUserDto interface
      const createUserType = result.types.find(
        (t) => t.name === 'CreateUserDto',
      );
      expect(createUserType).toBeDefined();
      expect(createUserType?.type).toBe('interface');
      expect(createUserType?.properties?.role).toEqual({
        type: 'UserRole',
        required: false,
      });
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(swaggerService, 'getDocument').mockImplementation(() => {
        throw new Error('Test error');
      });

      await expect(service.generateTypes()).rejects.toThrow(
        'Type generation failed: Test error',
      );
    });

    it('should remove duplicate types', async () => {
      const documentWithDuplicates = {
        ...mockSwaggerDocument,
        components: {
          schemas: {
            User: mockSwaggerDocument.components!.schemas!.User,
            DuplicateUser: mockSwaggerDocument.components!.schemas!.User, // Same schema, different name
          },
        },
      };

      jest
        .spyOn(swaggerService, 'getDocument')
        .mockReturnValue(documentWithDuplicates);

      const result = await service.generateTypes();

      expect(result.types).toHaveLength(2);
      expect(result.types.map((t) => t.name).sort()).toEqual([
        'DuplicateUser',
        'User',
      ]);
    });
  });
});
