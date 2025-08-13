import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';

import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';

import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  QueryTransactionDto,
  TransactionListResponse,
} from './dto/query-transaction.dto';
import { ImportResultDto } from './dto/import-result.dto';
import { Transaction } from './entities/transaction.entity';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: '创建交易记录' })
  create(@Body() dto: CreateTransactionDto): Promise<Transaction> {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '获取交易记录列表' })
  findAll(
    @Query() query: QueryTransactionDto,
  ): Promise<TransactionListResponse> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '获取交易记录详情' })
  @ApiParam({ name: 'id', description: '交易ID' })
  findOne(@Param('id') id: string): Promise<Transaction> {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: '更新交易记录' })
  @ApiParam({ name: 'id', description: '交易ID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: '删除交易记录' })
  @ApiParam({ name: 'id', description: '交易ID' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('export')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: '导出交易记录为Excel' })
  async export(@Res() res: Response) {
    const items = await this.service.getAllForExport();
    const buf = await this.service.generateExcelBuffer(items);
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  }

  @Post('import')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '从Excel导入交易记录' })
  async import(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResultDto> {
    if (!file) throw new BadRequestException('请选择要上传的Excel文件');
    return this.service.importFromExcel(file);
  }
}
