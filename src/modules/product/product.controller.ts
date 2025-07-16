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

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto, ProductListResponse } from './dto/query-product.dto';
import { ImportResultDto } from './dto/import-result.dto';
import { Product } from './entities/product.entity';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: '创建产品' })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '获取产品列表' })
  @ApiQuery({ name: 'page', required: false })
  findAll(@Query() query: QueryProductDto): Promise<ProductListResponse> {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '获取产品详情' })
  @ApiParam({ name: 'id', description: '产品ID' })
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: '更新产品' })
  @ApiParam({ name: 'id', description: '产品ID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: '删除产品' })
  @ApiParam({ name: 'id', description: '产品ID' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Get('export')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: '导出产品数据为Excel' })
  async export(@Res() res: Response) {
    const products = await this.productService.getAllForExport();
    const buf = await this.productService.generateExcelBuffer(products);
    const filename = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
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
  @ApiOperation({ summary: '从Excel导入产品数据' })
  async import(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResultDto> {
    if (!file) throw new BadRequestException('请选择要上传的Excel文件');
    return this.productService.importFromExcel(file);
  }
}
