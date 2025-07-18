import { Injectable } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';

@Injectable()
export class SwaggerDocumentService {
  private document: OpenAPIObject | null = null;

  setDocument(doc: OpenAPIObject) {
    this.document = doc;
  }

  getDocument(): OpenAPIObject | null {
    return this.document;
  }
}
