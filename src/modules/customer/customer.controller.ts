import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto, CustomerListResponse } from './dto/query-customer.dto';
import { Customer } from './entities/customer.entity';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';

@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);

  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '创建新客户' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '客户创建成功',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '邮箱或手机号已存在',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权',
  })
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    this.logger.log(`Creating customer with email: ${createCustomerDto.email}`);
    return await this.customerService.create(createCustomerDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '获取客户列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '客户列表获取成功',
    type: CustomerListResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权',
  })
  async findAll(@Query() queryDto: QueryCustomerDto): Promise<CustomerListResponse> {
    this.logger.log(`Querying customers with params: ${JSON.stringify(queryDto)}`);
    return await this.customerService.findAll(queryDto);
  }

  @Get('search/email/:email')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '根据邮箱查找客户' })
  @ApiParam({
    name: 'email',
    description: '客户邮箱',
    example: 'customer@example.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '客户查找成功',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '客户不存在',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权',
  })
  async findByEmail(@Param('email') email: string): Promise<Customer> {
    this.logger.log(`Finding customer by email: ${email}`);
    return await this.customerService.findByEmail(email);
  }

  @Get('search/phone/:phone')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '根据手机号查找客户' })
  @ApiParam({
    name: 'phone',
    description: '客户手机号',
    example: '+86 138 0013 8000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '客户查找成功',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '客户不存在',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权',
  })
  async findByPhone(@Param('phone') phone: string): Promise<Customer> {
    this.logger.log(`Finding customer by phone: ${phone}`);
    return await this.customerService.findByPhone(phone);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '根据ID获取客户详情' })
  @ApiParam({
    name: 'id',
    description: '客户ID',
    example: 'cust_1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '客户详情获取成功',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '客户不存在',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权',
  })
  async findOne(@Param('id') id: string): Promise<Customer> {
    this.logger.log(`Finding customer by ID: ${id}`);
    return await this.customerService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: '更新客户信息' })
  @ApiParam({
    name: 'id',
    description: '客户ID',
    example: 'cust_1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '客户信息更新成功',
    type: Customer,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '客户不存在',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '邮箱或手机号已存在',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    this.logger.log(`Updating customer with ID: ${id}`);
    return await this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '删除客户' })
  @ApiParam({
    name: 'id',
    description: '客户ID',
    example: 'cust_1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '客户删除成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '客户不存在',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '权限不足',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Deleting customer with ID: ${id}`);
    return await this.customerService.remove(id);
  }
}
