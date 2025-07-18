import { Injectable } from '@nestjs/common';
import { SwaggerDocumentService } from '@/shared/services/swagger-document.service';
import {
  quicktype,
  InputData,
  JSONSchemaInput,
  FetchingJSONSchemaStore,
} from 'quicktype-core';

@Injectable()
export class TypesService {
  constructor(private readonly swaggerService: SwaggerDocumentService) {}

  async generateTypes(): Promise<string> {
    const document = this.swaggerService.getDocument();
    if (!document) {
      return '';
    }

    const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());
    schemaInput.addSource({ name: 'Schema', schema: JSON.stringify(document) });

    const inputData = new InputData();
    inputData.addInput(schemaInput);

    const output = await quicktype({
      inputData,
      lang: 'typescript',
    });

    return output.lines.join('\n');
  }
}
