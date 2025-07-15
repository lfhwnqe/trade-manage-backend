import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
} from 'class-validator';
import { IdType, RiskLevel, CustomerStatus } from '../entities/customer.entity';

export class UpdateCustomerDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'customer@example.com',
    required: false,
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: '手机号码',
    example: '+86 138 0013 8000',
    required: false,
  })
  @IsString({ message: '手机号码必须是字符串' })
  @Matches(/^(\+86\s?)?1[3-9]\d{9}$/, {
    message: '请输入有效的中国大陆手机号码',
  })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: '名',
    example: '小明',
    required: false,
  })
  @IsString({ message: '名必须是字符串' })
  @MinLength(1, { message: '名至少需要1个字符' })
  @MaxLength(50, { message: '名不能超过50个字符' })
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: '姓',
    example: '张',
    required: false,
  })
  @IsString({ message: '姓必须是字符串' })
  @MinLength(1, { message: '姓至少需要1个字符' })
  @MaxLength(50, { message: '姓不能超过50个字符' })
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: '身份证件类型',
    enum: IdType,
    example: IdType.ID_CARD,
    required: false,
  })
  @IsEnum(IdType, { message: '请选择有效的身份证件类型' })
  @IsOptional()
  idType?: IdType;

  @ApiProperty({
    description: '身份证件号码',
    example: '110101199001011234',
    required: false,
  })
  @IsString({ message: '身份证件号码必须是字符串' })
  @MinLength(6, { message: '身份证件号码至少需要6个字符' })
  @MaxLength(30, { message: '身份证件号码不能超过30个字符' })
  @IsOptional()
  idNumber?: string;

  @ApiProperty({
    description: '出生日期 (YYYY-MM-DD格式)',
    example: '1990-01-01',
    required: false,
  })
  @IsDateString({}, { message: '请输入有效的日期格式 (YYYY-MM-DD)' })
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({
    description: '联系地址',
    example: '北京市朝阳区某某街道123号',
    required: false,
  })
  @IsString({ message: '联系地址必须是字符串' })
  @MinLength(5, { message: '联系地址至少需要5个字符' })
  @MaxLength(200, { message: '联系地址不能超过200个字符' })
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: '风险承受等级',
    enum: RiskLevel,
    example: RiskLevel.MEDIUM,
    required: false,
  })
  @IsEnum(RiskLevel, { message: '请选择有效的风险承受等级' })
  @IsOptional()
  riskLevel?: RiskLevel;

  @ApiProperty({
    description: '客户状态',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
    required: false,
  })
  @IsEnum(CustomerStatus, { message: '请选择有效的客户状态' })
  @IsOptional()
  status?: CustomerStatus;
}
