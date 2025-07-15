import { ApiProperty } from '@nestjs/swagger';

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum IdType {
  ID_CARD = '身份证',
  PASSPORT = '护照',
  OTHER = '其他',
}

export enum RiskLevel {
  LOW = '低',
  MEDIUM = '中',
  HIGH = '高',
}

export class Customer {
  @ApiProperty({
    description: '客户ID',
    example: 'cust_1234567890',
  })
  customerId: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'customer@example.com',
  })
  email: string;

  @ApiProperty({
    description: '手机号码',
    example: '+86 138 0013 8000',
  })
  phone: string;

  @ApiProperty({
    description: '名',
    example: '小明',
  })
  firstName: string;

  @ApiProperty({
    description: '姓',
    example: '张',
  })
  lastName: string;

  @ApiProperty({
    description: '身份证件类型',
    enum: IdType,
    example: IdType.ID_CARD,
  })
  idType: IdType;

  @ApiProperty({
    description: '身份证件号码',
    example: '110101199001011234',
  })
  idNumber: string;

  @ApiProperty({
    description: '出生日期',
    example: '1990-01-01',
  })
  dateOfBirth: string;

  @ApiProperty({
    description: '联系地址',
    example: '北京市朝阳区某某街道123号',
  })
  address: string;

  @ApiProperty({
    description: '风险承受等级',
    enum: RiskLevel,
    example: RiskLevel.MEDIUM,
  })
  riskLevel: RiskLevel;

  @ApiProperty({
    description: '客户状态',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @ApiProperty({
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: '更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}
