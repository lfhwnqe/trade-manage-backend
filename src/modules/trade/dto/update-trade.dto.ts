import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { TradeStatus } from './create-trade.dto';

export class UpdateTradeDto {
  @ApiProperty({
    description: 'Trade status',
    enum: TradeStatus,
    example: TradeStatus.COMPLETED,
    required: false,
  })
  @IsEnum(TradeStatus)
  @IsOptional()
  status?: TradeStatus;

  @ApiProperty({
    description: 'Updated price per share',
    example: 155.75,
    minimum: 0.01,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  price?: number;

  @ApiProperty({
    description: 'Trade notes',
    example: 'Updated investment strategy',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Stop loss price',
    example: 145.0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  stopLoss?: number;

  @ApiProperty({
    description: 'Take profit price',
    example: 185.0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  takeProfit?: number;

  @ApiProperty({
    description: 'Exit price (when trade is completed)',
    example: 175.25,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  exitPrice?: number;
}
