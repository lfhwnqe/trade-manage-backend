import { Injectable, Logger } from '@nestjs/common';
import { SwaggerDocumentService } from '@/shared/services/swagger-document.service';
import { OpenAPIObject } from '@nestjs/swagger';

export interface TypeDefinition {
  name: string;
  type: 'interface' | 'enum' | 'type';
  properties?: Record<string, PropertyDefinition>;
  values?: string[]; // for enums
  description?: string;
}

export interface PropertyDefinition {
  type: string;
  required: boolean;
  description?: string;
  format?: string;
  example?: any;
  enum?: string[];
}

export interface TypesResponse {
  types: TypeDefinition[];
  totalCount: number;
  generatedAt: string;
}

@Injectable()
export class TypesService {
  private readonly logger = new Logger(TypesService.name);

  constructor(private readonly swaggerService: SwaggerDocumentService) {}

  async generateTypes(): Promise<TypesResponse> {
    try {
      const document = this.swaggerService.getDocument();
      if (!document) {
        this.logger.warn('No Swagger document available');
        return {
          types: [],
          totalCount: 0,
          generatedAt: new Date().toISOString(),
        };
      }

      const types = this.extractTypesFromDocument(document);

      this.logger.log(`Generated ${types.length} type definitions`);

      return {
        types,
        totalCount: types.length,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to generate types', error.stack);
      throw new Error(`Type generation failed: ${error.message}`);
    }
  }

  private extractTypesFromDocument(document: OpenAPIObject): TypeDefinition[] {
    const types: TypeDefinition[] = [];

    // Extract types from components/schemas
    if (document.components?.schemas) {
      for (const [name, schema] of Object.entries(document.components.schemas)) {
        const typeDefinition = this.convertSchemaToTypeDefinition(name, schema);
        if (typeDefinition) {
          types.push(typeDefinition);
        }
      }
    }

    // Extract types from response schemas in paths
    if (document.paths) {
      const pathTypes = this.extractTypesFromPaths(document.paths);
      types.push(...pathTypes);
    }

    // Remove duplicates based on name
    const uniqueTypes = types.filter((type, index, self) =>
      index === self.findIndex(t => t.name === type.name)
    );

    return uniqueTypes.sort((a, b) => a.name.localeCompare(b.name));
  }

  private convertSchemaToTypeDefinition(name: string, schema: any): TypeDefinition | null {
    try {
      if (!schema || typeof schema !== 'object') {
        return null;
      }

      // Handle enum types
      if (schema.enum) {
        return {
          name,
          type: 'enum',
          values: schema.enum,
          description: schema.description,
        };
      }

      // Handle object types
      if (schema.type === 'object' || schema.properties) {
        const properties: Record<string, PropertyDefinition> = {};
        const required = schema.required || [];

        if (schema.properties) {
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const propertyDef = this.convertPropertySchema(propSchema as any);
            if (propertyDef) {
              properties[propName] = {
                ...propertyDef,
                required: required.includes(propName),
              };
            }
          }
        }

        return {
          name,
          type: 'interface',
          properties,
          description: schema.description,
        };
      }

      // Handle primitive types or type aliases
      if (schema.type) {
        return {
          name,
          type: 'type',
          description: schema.description,
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to convert schema for ${name}:`, error.message);
      return null;
    }
  }

  private convertPropertySchema(schema: any): PropertyDefinition | null {
    if (!schema || typeof schema !== 'object') {
      return null;
    }

    let type = 'any';

    if (schema.$ref) {
      // Extract type name from $ref
      const refParts = schema.$ref.split('/');
      type = refParts[refParts.length - 1];
    } else if (schema.type) {
      switch (schema.type) {
        case 'string':
          type = 'string';
          break;
        case 'number':
        case 'integer':
          type = 'number';
          break;
        case 'boolean':
          type = 'boolean';
          break;
        case 'array':
          if (schema.items) {
            const itemType = this.convertPropertySchema(schema.items);
            type = itemType ? `${itemType.type}[]` : 'any[]';
          } else {
            type = 'any[]';
          }
          break;
        case 'object':
          type = 'object';
          break;
        default:
          type = schema.type;
      }
    }

    return {
      type,
      required: false, // Will be set by parent
      description: schema.description,
      format: schema.format,
      example: schema.example,
      enum: schema.enum,
    };
  }

  private extractTypesFromPaths(paths: any): TypeDefinition[] {
    const types: TypeDefinition[] = [];

    try {
      for (const [path, pathItem] of Object.entries(paths)) {
        if (!pathItem || typeof pathItem !== 'object') continue;

        for (const [method, operation] of Object.entries(pathItem)) {
          if (!operation || typeof operation !== 'object') continue;

          // Extract request body types
          if (operation.requestBody?.content) {
            const requestTypes = this.extractTypesFromContent(
              operation.requestBody.content,
              `${this.pathToTypeName(path)}${this.capitalizeFirst(method)}Request`
            );
            types.push(...requestTypes);
          }

          // Extract response types
          if (operation.responses) {
            for (const [statusCode, response] of Object.entries(operation.responses)) {
              if (response && typeof response === 'object' && 'content' in response && response.content) {
                const responseTypes = this.extractTypesFromContent(
                  response.content,
                  `${this.pathToTypeName(path)}${this.capitalizeFirst(method)}Response${statusCode}`
                );
                types.push(...responseTypes);
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to extract types from paths:', error.message);
    }

    return types;
  }

  private extractTypesFromContent(content: any, baseName: string): TypeDefinition[] {
    const types: TypeDefinition[] = [];

    try {
      for (const [mediaType, mediaTypeObject] of Object.entries(content)) {
        if (mediaTypeObject && typeof mediaTypeObject === 'object' && 'schema' in mediaTypeObject && mediaTypeObject.schema) {
          const typeDefinition = this.convertSchemaToTypeDefinition(
            `${baseName}${mediaType === 'application/json' ? '' : this.capitalizeFirst(mediaType.replace('/', ''))}`,
            mediaTypeObject.schema
          );
          if (typeDefinition) {
            types.push(typeDefinition);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to extract types from content for ${baseName}:`, error.message);
    }

    return types;
  }

  private pathToTypeName(path: string): string {
    return path
      .split('/')
      .filter(segment => segment && !segment.startsWith('{'))
      .map(segment => this.capitalizeFirst(segment))
      .join('');
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
