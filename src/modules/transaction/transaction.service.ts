import { Injectable, NotFoundException, BadRequestException, Logger, UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as Excel from 'exceljs';

import { DynamodbService } from '../../database/dynamodb.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto, TransactionListResponse } from './dto/query-transaction.dto';
import { Transaction, TransactionStatus, TransactionType, PaymentMethod } from './entities/transaction.entity';
import { ImportResultDto, ImportErrorDetail } from './dto/import-result.dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private readonly tableName: string;

  constructor(
    private readonly dynamodbService: DynamodbService,
    private readonly configService: ConfigService,
  ) {
    this.tableName = this.configService.get<string>('database.tables.customerProductTransactions');
  }

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    const now = new Date().toISOString();
    const transactionId = `txn_${uuidv4()}`;

    const item: Transaction = {
      transactionId,
      ...dto,
      totalAmount: dto.totalAmount ?? dto.unitPrice * dto.quantity,
      transactionStatus: dto.transactionStatus || TransactionStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamodbService.put(this.tableName, item);
    return item;
  }

  async findAll(query: QueryTransactionDto): Promise<TransactionListResponse> {
    const items = await this.dynamodbService.scan(this.tableName);

    let filtered = items;
    if (query.customerId) {
      filtered = filtered.filter((i) => i.customerId === query.customerId);
    }
    if (query.productId) {
      filtered = filtered.filter((i) => i.productId === query.productId);
    }
    if (query.transactionStatus) {
      filtered = filtered.filter((i) => i.transactionStatus === query.transactionStatus);
    }

    filtered.sort((a, b) => {
      const aVal = a[query.sortBy] || '';
      const bVal = b[query.sortBy] || '';
      if (query.sortOrder === 'asc') return String(aVal).localeCompare(String(bVal));
      return String(bVal).localeCompare(String(aVal));
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / query.limit);
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const data = filtered.slice(start, end);

    return { data, total, page: query.page, limit: query.limit, totalPages };
  }

  async findOne(transactionId: string): Promise<Transaction> {
    const item = await this.dynamodbService.get(this.tableName, { transactionId });
    if (!item) throw new NotFoundException('记录不存在');
    return item;
  }

  async update(transactionId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    await this.findOne(transactionId);

    if (dto.transactionId && dto.transactionId !== transactionId) {
      throw new BadRequestException('交易ID与参数不一致');
    }

    let updateExpression = 'SET #updatedAt = :updatedAt';
    const names: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const values: Record<string, any> = { ':updatedAt': new Date().toISOString() };

    Object.keys(dto).forEach((key, i) => {
      const attr = `#attr${i}`;
      const val = `:val${i}`;
      updateExpression += `, ${attr} = ${val}`;
      names[attr] = key;
      values[val] = (dto as any)[key];
    });

    const updated = await this.dynamodbService.update(
      this.tableName,
      { transactionId },
      updateExpression,
      values,
      names,
    );

    return updated;
  }

  async remove(transactionId: string): Promise<{ message: string }> {
    await this.findOne(transactionId);
    await this.dynamodbService.delete(this.tableName, { transactionId });
    return { message: '删除成功' };
  }

  async getAllForExport(): Promise<Transaction[]> {
    const items = await this.dynamodbService.scan(this.tableName);
    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return items;
  }

  async generateExcelBuffer(transactions: Transaction[]): Promise<Buffer> {
    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('交易记录');

    sheet.columns = [
      { header: '交易ID', key: 'transactionId', width: 20 },
      { header: '客户ID', key: 'customerId', width: 20 },
      { header: '产品ID', key: 'productId', width: 20 },
      { header: '交易类型', key: 'transactionType', width: 12 },
      { header: '数量', key: 'quantity', width: 10 },
      { header: '单价', key: 'unitPrice', width: 10 },
      { header: '总金额', key: 'totalAmount', width: 15 },
      { header: '支付方式', key: 'paymentMethod', width: 15 },
      { header: '交易状态', key: 'transactionStatus', width: 15 },
      { header: '预期到期日期', key: 'expectedMaturityDate', width: 15 },
      { header: '实际收益率', key: 'actualReturnRate', width: 12 },
      { header: '备注', key: 'notes', width: 20 },
      { header: '创建时间', key: 'createdAt', width: 20 },
      { header: '更新时间', key: 'updatedAt', width: 20 },
      { header: '完成时间', key: 'completedAt', width: 20 },
    ];

    transactions.forEach((t) => sheet.addRow(t));

    return workbook.xlsx.writeBuffer();
  }

  async importFromExcel(file: Express.Multer.File): Promise<ImportResultDto> {
    if (!file.originalname.endsWith('.xlsx')) {
      throw new UnsupportedMediaTypeException('仅支持xlsx格式');
    }

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.worksheets[0];

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const data = {
        customerId: row.getCell(1).text.trim(),
        productId: row.getCell(2).text.trim(),
        transactionType: row.getCell(3).text.trim() as TransactionType,
        quantity: Number(row.getCell(4).value),
        unitPrice: Number(row.getCell(5).value),
        totalAmount: Number(row.getCell(6).value),
        paymentMethod: row.getCell(7).text.trim() as PaymentMethod,
        transactionStatus: (row.getCell(8).text.trim() as TransactionStatus) || TransactionStatus.PENDING,
        expectedMaturityDate: row.getCell(9).text.trim(),
        actualReturnRate: row.getCell(10).value !== null ? Number(row.getCell(10).value) : undefined,
        notes: row.getCell(11).text.trim(),
      } as any;
      rows.push({ data, rowNumber });
    });

    let successCount = 0;
    const errors: ImportErrorDetail[] = [];

    for (const item of rows) {
      try {
        await this.create(item.data);
        successCount++;
      } catch (e) {
        errors.push({ row: item.rowNumber, error: e.message, data: item.data });
      }
    }

    const result: ImportResultDto = {
      successCount,
      failureCount: errors.length,
      skippedCount: 0,
      totalCount: rows.length,
      errors,
      message: `导入完成：成功 ${successCount} 条，失败 ${errors.length} 条`,
    };

    return result;
  }
}
