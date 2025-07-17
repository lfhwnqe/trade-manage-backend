import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../entities/transaction.entity';
import { ProductType } from '../../product/entities/product.entity';

export class PurchasedProductDto {
  @ApiProperty({ description: '交易ID' })
  transactionId: string;

  @ApiProperty({ description: '产品ID' })
  productId: string;

  @ApiProperty({ description: '产品名称', required: false })
  productName?: string;

  @ApiProperty({ description: '产品类型', enum: ProductType, required: false })
  productType?: ProductType;

  @ApiProperty({ description: '数量' })
  quantity: number;

  @ApiProperty({ description: '单价' })
  unitPrice: number;

  @ApiProperty({ description: '总金额' })
  totalAmount: number;

  @ApiProperty({ description: '交易状态', enum: TransactionStatus })
  transactionStatus: TransactionStatus;

  @ApiProperty({ description: '预期收益率(%)', required: false })
  expectedReturn?: number;

  @ApiProperty({ description: '预期收益', required: false })
  expectedProfit?: number;

  @ApiProperty({ description: '实际收益率(%)', required: false })
  actualReturnRate?: number;

  @ApiProperty({ description: '实际收益', required: false })
  actualProfit?: number;

  @ApiProperty({ description: '预期到期日期', required: false })
  expectedMaturityDate?: string;

  @ApiProperty({ description: '完成时间', required: false })
  completedAt?: string;
}
