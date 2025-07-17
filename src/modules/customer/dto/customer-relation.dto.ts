import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CustomerRelationDto {
  @ApiProperty({
    description: '关联客户ID',
    example: 'cust_abcdef123456',
  })
  @IsString({ message: '关联客户ID必须是字符串' })
  @IsNotEmpty({ message: '关联客户ID不能为空' })
  customerId: string;

  @ApiProperty({
    description: '与该客户的关系',
    example: '朋友',
  })
  @IsString({ message: '关系描述必须是字符串' })
  @IsNotEmpty({ message: '关系描述不能为空' })
  @MaxLength(100, { message: '关系描述不能超过100个字符' })
  relation: string;
}
