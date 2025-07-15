import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamodbService } from '../../database/dynamodb.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto, CustomerListResponse } from './dto/query-customer.dto';
import { Customer, CustomerStatus } from './entities/customer.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);
  private readonly tableName: string;

  constructor(
    private readonly dynamodbService: DynamodbService,
    private readonly configService: ConfigService,
  ) {
    this.tableName = this.configService.get<string>('database.tables.customers');
  }

  /**
   * 创建新客户
   */
  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    this.logger.log(`Creating new customer with email: ${createCustomerDto.email}`);

    // 检查邮箱是否已存在
    await this.checkEmailExists(createCustomerDto.email);

    // 检查手机号是否已存在
    await this.checkPhoneExists(createCustomerDto.phone);

    const now = new Date().toISOString();
    const customerId = `cust_${uuidv4()}`;

    const customer: Customer = {
      customerId,
      ...createCustomerDto,
      status: createCustomerDto.status || CustomerStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.dynamodbService.put(this.tableName, customer);
      this.logger.log(`Customer created successfully with ID: ${customerId}`);
      return customer;
    } catch (error) {
      this.logger.error(`Failed to create customer: ${error.message}`, error.stack);
      throw new BadRequestException('创建客户失败');
    }
  }

  /**
   * 获取客户列表（支持分页和筛选）
   */
  async findAll(queryDto: QueryCustomerDto): Promise<CustomerListResponse> {
    this.logger.log(`Querying customers with filters: ${JSON.stringify(queryDto)}`);

    try {
      // 构建筛选条件
      let filterExpression = '';
      const expressionAttributeValues: any = {};
      const expressionAttributeNames: any = {};

      // 状态筛选
      if (queryDto.status) {
        filterExpression += '#status = :status';
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = queryDto.status;
      }

      // 风险等级筛选
      if (queryDto.riskLevel) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += 'riskLevel = :riskLevel';
        expressionAttributeValues[':riskLevel'] = queryDto.riskLevel;
      }

      // 时间范围筛选
      if (queryDto.startDate) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += 'createdAt >= :startDate';
        expressionAttributeValues[':startDate'] = queryDto.startDate;
      }

      if (queryDto.endDate) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += 'createdAt <= :endDate';
        expressionAttributeValues[':endDate'] = queryDto.endDate + 'T23:59:59.999Z';
      }

      // 执行扫描查询
      const allItems = await this.dynamodbService.scan(
        this.tableName,
        filterExpression || undefined,
        Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
      );

      // 搜索关键词筛选（在内存中进行）
      let filteredItems = allItems;
      if (queryDto.search) {
        const searchTerm = queryDto.search.toLowerCase();
        filteredItems = allItems.filter((item) => {
          const fullName = `${item.firstName}${item.lastName}`.toLowerCase();
          return (
            fullName.includes(searchTerm) ||
            item.email.toLowerCase().includes(searchTerm) ||
            item.phone.includes(searchTerm)
          );
        });
      }

      // 排序
      filteredItems.sort((a, b) => {
        const aValue = a[queryDto.sortBy] || '';
        const bValue = b[queryDto.sortBy] || '';
        
        if (queryDto.sortOrder === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });

      // 分页
      const total = filteredItems.length;
      const totalPages = Math.ceil(total / queryDto.limit);
      const startIndex = (queryDto.page - 1) * queryDto.limit;
      const endIndex = startIndex + queryDto.limit;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);

      this.logger.log(`Found ${total} customers, returning page ${queryDto.page} with ${paginatedItems.length} items`);

      return {
        data: paginatedItems,
        total,
        page: queryDto.page,
        limit: queryDto.limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to query customers: ${error.message}`, error.stack);
      throw new BadRequestException('查询客户列表失败');
    }
  }

  /**
   * 根据ID获取单个客户
   */
  async findOne(customerId: string): Promise<Customer> {
    this.logger.log(`Finding customer with ID: ${customerId}`);

    try {
      const customer = await this.dynamodbService.get(this.tableName, { customerId });

      if (!customer) {
        this.logger.warn(`Customer not found with ID: ${customerId}`);
        throw new NotFoundException('客户不存在');
      }

      this.logger.log(`Customer found: ${customerId}`);
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find customer: ${error.message}`, error.stack);
      throw new BadRequestException('查询客户失败');
    }
  }

  /**
   * 根据邮箱查找客户
   */
  async findByEmail(email: string): Promise<Customer> {
    this.logger.log(`Finding customer with email: ${email}`);

    try {
      const customers = await this.dynamodbService.query(
        this.tableName,
        'email = :email',
        { ':email': email },
        'EmailIndex',
      );

      if (customers.length === 0) {
        this.logger.warn(`Customer not found with email: ${email}`);
        throw new NotFoundException('客户不存在');
      }

      this.logger.log(`Customer found with email: ${email}`);
      return customers[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find customer by email: ${error.message}`, error.stack);
      throw new BadRequestException('查询客户失败');
    }
  }

  /**
   * 根据手机号查找客户
   */
  async findByPhone(phone: string): Promise<Customer> {
    this.logger.log(`Finding customer with phone: ${phone}`);

    try {
      const customers = await this.dynamodbService.query(
        this.tableName,
        'phone = :phone',
        { ':phone': phone },
        'PhoneIndex',
      );

      if (customers.length === 0) {
        this.logger.warn(`Customer not found with phone: ${phone}`);
        throw new NotFoundException('客户不存在');
      }

      this.logger.log(`Customer found with phone: ${phone}`);
      return customers[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find customer by phone: ${error.message}`, error.stack);
      throw new BadRequestException('查询客户失败');
    }
  }

  /**
   * 更新客户信息
   */
  async update(customerId: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    this.logger.log(`Updating customer with ID: ${customerId}`);

    // 检查客户是否存在
    const existingCustomer = await this.findOne(customerId);

    // 如果更新邮箱，检查新邮箱是否已被其他客户使用
    if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
      await this.checkEmailExists(updateCustomerDto.email, customerId);
    }

    // 如果更新手机号，检查新手机号是否已被其他客户使用
    if (updateCustomerDto.phone && updateCustomerDto.phone !== existingCustomer.phone) {
      await this.checkPhoneExists(updateCustomerDto.phone, customerId);
    }

    try {
      // 构建更新表达式
      let updateExpression = 'SET #updatedAt = :updatedAt';
      const expressionAttributeNames = { '#updatedAt': 'updatedAt' };
      const expressionAttributeValues = {
        ':updatedAt': new Date().toISOString(),
      };

      // 动态构建更新字段
      Object.keys(updateCustomerDto).forEach((key, index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpression += `, ${attrName} = ${attrValue}`;
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = updateCustomerDto[key];
      });

      const updatedCustomer = await this.dynamodbService.update(
        this.tableName,
        { customerId },
        updateExpression,
        expressionAttributeValues,
        expressionAttributeNames,
      );

      this.logger.log(`Customer updated successfully: ${customerId}`);
      return updatedCustomer;
    } catch (error) {
      this.logger.error(`Failed to update customer: ${error.message}`, error.stack);
      throw new BadRequestException('更新客户失败');
    }
  }

  /**
   * 删除客户
   */
  async remove(customerId: string): Promise<{ message: string }> {
    this.logger.log(`Deleting customer with ID: ${customerId}`);

    // 检查客户是否存在
    await this.findOne(customerId);

    try {
      await this.dynamodbService.delete(this.tableName, { customerId });
      this.logger.log(`Customer deleted successfully: ${customerId}`);
      return { message: '客户删除成功' };
    } catch (error) {
      this.logger.error(`Failed to delete customer: ${error.message}`, error.stack);
      throw new BadRequestException('删除客户失败');
    }
  }

  /**
   * 检查邮箱是否已存在
   * @param email 邮箱
   * @param excludeCustomerId 排除的客户ID（用于更新操作）
   */
  private async checkEmailExists(email: string, excludeCustomerId?: string): Promise<void> {
    try {
      const customers = await this.dynamodbService.query(
        this.tableName,
        'email = :email',
        { ':email': email },
        'EmailIndex',
      );

      if (customers.length > 0 && customers[0].customerId !== excludeCustomerId) {
        this.logger.warn(`Email already exists: ${email}`);
        throw new ConflictException('邮箱已被使用');
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error checking email existence: ${error.message}`, error.stack);
      throw new BadRequestException('验证邮箱失败');
    }
  }

  /**
   * 检查手机号是否已存在
   * @param phone 手机号
   * @param excludeCustomerId 排除的客户ID（用于更新操作）
   */
  private async checkPhoneExists(phone: string, excludeCustomerId?: string): Promise<void> {
    try {
      const customers = await this.dynamodbService.query(
        this.tableName,
        'phone = :phone',
        { ':phone': phone },
        'PhoneIndex',
      );

      if (customers.length > 0 && customers[0].customerId !== excludeCustomerId) {
        this.logger.warn(`Phone already exists: ${phone}`);
        throw new ConflictException('手机号已被使用');
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error checking phone existence: ${error.message}`, error.stack);
      throw new BadRequestException('验证手机号失败');
    }
  }
}
