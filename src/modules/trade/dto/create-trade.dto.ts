import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum TradeStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateTradeDto {
  @ApiProperty({
    description: 'Trading symbol',
    example: 'AAPL',
  })
  @IsString()
  symbol: string;

  @ApiProperty({
    description: 'Trade type',
    enum: TradeType,
    example: TradeType.BUY,
  })
  @IsEnum(TradeType)
  type: TradeType;

  @ApiProperty({
    description: 'Quantity of shares',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Price per share',
    example: 150.5,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  price: number;

  @ApiProperty({
    description: 'Trade notes',
    example: 'Long-term investment',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Stop loss price',
    example: 140.0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  stopLoss?: number;

  @ApiProperty({
    description: 'Take profit price',
    example: 180.0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  takeProfit?: number;
}
