import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { TradeService } from './trade.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles, Role } from '../../common/decorators/roles.decorator';

@ApiTags('Trades')
@Controller('trades')
@ApiBearerAuth('JWT-auth')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trade' })
  @ApiResponse({ status: 201, description: 'Trade created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser('userId') userId: string,
    @Body() createTradeDto: CreateTradeDto,
  ) {
    return this.tradeService.create(userId, createTradeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trades' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
  })
  @ApiResponse({ status: 200, description: 'Trades retrieved successfully' })
  findAll(@CurrentUser() user: any, @Query('userId') userId?: string) {
    // Regular users can only see their own trades
    if (user.role !== 'super_admin') {
      return this.tradeService.findAll(user.userId);
    }

    // Admins can see all trades or filter by userId
    return this.tradeService.findAll(userId);
  }

  @Get('my-trades')
  @ApiOperation({ summary: 'Get current user trades' })
  @ApiResponse({
    status: 200,
    description: 'User trades retrieved successfully',
  })
  getUserTrades(@CurrentUser('userId') userId: string) {
    return this.tradeService.getUserTrades(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trade by ID' })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  @ApiResponse({ status: 200, description: 'Trade retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Trade not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // Regular users can only access their own trades
    const userId = user.role === 'super_admin' ? undefined : user.userId;
    return this.tradeService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trade by ID' })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  @ApiResponse({ status: 200, description: 'Trade updated successfully' })
  @ApiResponse({ status: 404, description: 'Trade not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updateTradeDto: UpdateTradeDto,
  ) {
    return this.tradeService.update(id, userId, updateTradeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete trade by ID' })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  @ApiResponse({ status: 200, description: 'Trade deleted successfully' })
  @ApiResponse({ status: 404, description: 'Trade not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.tradeService.remove(id, userId);
  }
}
