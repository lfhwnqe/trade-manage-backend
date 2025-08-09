import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as Excel from 'exceljs';

import { DynamodbService } from '../../database/dynamodb.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto, ProductListResponse } from './dto/query-product.dto';
import { Product, ProductStatus, ProductType } from './entities/product.entity';
import { ImportResultDto, ImportErrorDetail } from './dto/import-result.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly tableName: string;

  constructor(
    private readonly dynamodbService: DynamodbService,
    private readonly configService: ConfigService,
  ) {
    this.tableName = this.configService.get<string>('database.tables.products');
  }

  async create(createDto: CreateProductDto, createdBy: string): Promise<Product> {
    const now = new Date().toISOString();
    const productId = `prod_${uuidv4()}`;

    const product: Product = {
      productId,
      ...createDto,
      status: createDto.status || ProductStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    await this.dynamodbService.put(this.tableName, product);
    return product;
  }

  async findAll(
    query: QueryProductDto,
    currentUser: { userId: string; role: string },
  ): Promise<ProductListResponse> {
    const all = await this.dynamodbService.scan(this.tableName);

    let items = all;
    // 非超级管理员仅能查看自己创建的资源
    if ((currentUser?.role || 'user') !== 'super_admin') {
      items = items.filter((p) => p.createdBy === currentUser?.userId);
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      items = items.filter((p) => p.productName.toLowerCase().includes(term));
    }
    if (query.productType) {
      items = items.filter((p) => p.productType === query.productType);
    }
    if (query.status) {
      items = items.filter((p) => p.status === query.status);
    }

    items.sort((a, b) => {
      const aVal = a[query.sortBy] || '';
      const bVal = b[query.sortBy] || '';
      if (query.sortOrder === 'asc')
        return String(aVal).localeCompare(String(bVal));
      return String(bVal).localeCompare(String(aVal));
    });

    const total = items.length;
    const totalPages = Math.ceil(total / query.limit);
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const data = items.slice(start, end);

    return { data, total, page: query.page, limit: query.limit, totalPages };
  }

  async findOne(
    productId: string,
    currentUser?: { userId: string; role: string },
  ): Promise<Product> {
    const product = await this.dynamodbService.get(this.tableName, {
      productId,
    });
    if (!product) throw new NotFoundException('产品不存在');
    // 详情访问控制：非超级管理员仅能访问自己资源
    if (currentUser && currentUser.role !== 'super_admin') {
      if (product.createdBy && product.createdBy !== currentUser.userId) {
        throw new NotFoundException('产品不存在');
      }
    }
    return product;
  }

  async update(
    productId: string,
    updateDto: UpdateProductDto,
    currentUser: { userId: string; role: string },
  ): Promise<Product> {
    const existing = await this.findOne(productId);
    if (currentUser.role !== 'super_admin' && existing.createdBy !== currentUser.userId) {
      throw new NotFoundException('产品不存在');
    }

    if (updateDto.productId && updateDto.productId !== productId) {
      throw new BadRequestException('产品ID与参数不一致');
    }

    let updateExpression = 'SET #updatedAt = :updatedAt';
    const names: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const values: Record<string, any> = {
      ':updatedAt': new Date().toISOString(),
    };

    Object.keys(updateDto).forEach((key, i) => {
      const attr = `#attr${i}`;
      const val = `:val${i}`;
      updateExpression += `, ${attr} = ${val}`;
      names[attr] = key;
      values[val] = (updateDto as any)[key];
    });

    const updated = await this.dynamodbService.update(
      this.tableName,
      { productId },
      updateExpression,
      values,
      names,
    );

    return updated;
  }

  async remove(
    productId: string,
    currentUser: { userId: string; role: string },
  ): Promise<{ message: string }> {
    const existing = await this.findOne(productId);
    if (currentUser.role !== 'super_admin' && existing.createdBy !== currentUser.userId) {
      throw new NotFoundException('产品不存在');
    }
    await this.dynamodbService.delete(this.tableName, { productId });
    return { message: '产品删除成功' };
  }

  async getAllForExport(currentUser: { userId: string; role: string }): Promise<Product[]> {
    const items = await this.dynamodbService.scan(this.tableName);
    const filtered = (currentUser.role === 'super_admin')
      ? items
      : items.filter((p) => p.createdBy === currentUser.userId);
    filtered.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return filtered;
  }

  async generateExcelBuffer(products: Product[]): Promise<Buffer> {
    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('产品数据');

    sheet.columns = [
      { header: '产品ID', key: 'productId', width: 20 },
      { header: '产品名称', key: 'productName', width: 20 },
      { header: '产品类型', key: 'productType', width: 15 },
      { header: '风险等级', key: 'riskLevel', width: 10 },
      { header: '最低投资金额', key: 'minInvestment', width: 15 },
      { header: '最高投资金额', key: 'maxInvestment', width: 15 },
      { header: '预期收益率', key: 'expectedReturn', width: 15 },
      { header: '结息日期', key: 'interestPaymentDate', width: 15 },
      { header: '产品期限', key: 'maturityPeriod', width: 12 },
      { header: '产品状态', key: 'status', width: 12 },
      { header: '销售开始日期', key: 'salesStartDate', width: 15 },
      { header: '销售结束日期', key: 'salesEndDate', width: 15 },
      { header: '创建时间', key: 'createdAt', width: 20 },
    ];

    products.forEach((p) => sheet.addRow(p));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async importFromExcel(
    file: Express.Multer.File,
    createdBy: string,
  ): Promise<ImportResultDto> {
    if (!file.originalname.endsWith('.xlsx')) {
      throw new UnsupportedMediaTypeException('仅支持xlsx格式');
    }

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.worksheets[0];

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const data = {
        productName: row.getCell(1).text.trim(),
        productType: row.getCell(2).text.trim() as ProductType,
        riskLevel: row.getCell(3).text.trim() as any,
        minInvestment: Number(row.getCell(4).value),
        maxInvestment: Number(row.getCell(5).value),
        expectedReturn: Number(row.getCell(6).value),
        interestPaymentDate: row.getCell(7).text.trim(),
        maturityPeriod: Number(row.getCell(8).value),
        status:
          (row.getCell(9).text.trim() as ProductStatus) || ProductStatus.ACTIVE,
        salesStartDate: row.getCell(10).text.trim(),
        salesEndDate: row.getCell(11).text.trim(),
        description: row.getCell(12).text.trim(),
      } as any;
      rows.push({ data, rowNumber });
    });

    let successCount = 0;
    const errors: ImportErrorDetail[] = [];

    for (const item of rows) {
      try {
        await this.create(item.data, createdBy);
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
