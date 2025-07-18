import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { S3Service } from './services/s3.service';
import { CognitoService } from './services/cognito.service';
import { SwaggerDocumentService } from './services/swagger-document.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [S3Service, CognitoService, SwaggerDocumentService],
  exports: [S3Service, CognitoService, SwaggerDocumentService],
})
export class SharedModule {}
