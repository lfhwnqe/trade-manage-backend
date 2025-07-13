import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DynamodbService } from '../../database/dynamodb.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

@Injectable()
export class TradeService {
  constructor(private dynamodbService: DynamodbService) {}

  async create(userId: string, createTradeDto: CreateTradeDto) {
    const tradeId = uuidv4();
    const now = new Date().toISOString();

    const trade = {
      tradeId,
      userId,
      ...createTradeDto,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamodbService.put('trades', trade);
    return trade;
  }

  async findAll(userId?: string) {
    if (userId) {
      return await this.dynamodbService.query(
        'trades',
        'userId = :userId',
        { ':userId': userId },
        'UserTradesIndex',
      );
    }
    return await this.dynamodbService.scan('trades');
  }

  async findOne(tradeId: string, userId?: string) {
    const trade = await this.dynamodbService.get('trades', {
      tradeId,
      createdAt: await this.getTradeCreatedAt(tradeId),
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    if (userId && trade.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return trade;
  }

  async update(
    tradeId: string,
    userId: string,
    updateTradeDto: UpdateTradeDto,
  ) {
    const existingTrade = await this.findOne(tradeId, userId);

    let updateExpression = 'SET #updatedAt = :updatedAt';
    const expressionAttributeNames = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues = {
      ':updatedAt': new Date().toISOString(),
    };

    // Build dynamic update expression
    Object.keys(updateTradeDto).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpression += `, ${attrName} = ${attrValue}`;
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updateTradeDto[key];
    });

    return await this.dynamodbService.update(
      'trades',
      { tradeId, createdAt: existingTrade.createdAt },
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames,
    );
  }

  async remove(tradeId: string, userId: string) {
    const existingTrade = await this.findOne(tradeId, userId);

    await this.dynamodbService.delete('trades', {
      tradeId,
      createdAt: existingTrade.createdAt,
    });

    return { message: 'Trade deleted successfully' };
  }

  async getUserTrades(userId: string) {
    return await this.dynamodbService.query(
      'trades',
      'userId = :userId',
      { ':userId': userId },
      'UserTradesIndex',
    );
  }

  private async getTradeCreatedAt(tradeId: string): Promise<string> {
    // This is a helper method to get createdAt for composite key
    // In a real implementation, you might store this differently or use a different approach
    const trades = await this.dynamodbService.scan(
      'trades',
      'tradeId = :tradeId',
      { ':tradeId': tradeId },
    );

    if (trades.length === 0) {
      throw new NotFoundException('Trade not found');
    }

    return trades[0].createdAt;
  }
}
