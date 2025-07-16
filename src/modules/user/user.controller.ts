import {
  Controller,
  Get,
  Body,
  Patch,
  Post,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InitSuperAdminDto } from './dto/init-super-admin.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.userService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser('userId') userId: string) {
    return this.userService.findOne(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(userId, updateUserDto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid current password or email not verified',
  })
  changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, dto);
  }

  @Public()
  @Post('init-super-admin')
  @ApiOperation({ summary: 'Initialize super admin with a registered user' })
  @ApiResponse({ status: 201, description: 'User promoted to super admin' })
  @ApiResponse({
    status: 400,
    description: 'Super admin already exists or email not verified',
  })
  initSuperAdmin(@Body() dto: InitSuperAdminDto) {
    return this.userService.initSuperAdmin(dto.username);
  }

  @Patch('make-super-admin')
  @ApiOperation({ summary: 'Promote current user to super admin' })
  @ApiResponse({ status: 200, description: 'User promoted to super admin' })
  @ApiResponse({
    status: 400,
    description: 'Super admin already exists or email not verified',
  })
  makeSuperAdmin(@CurrentUser('userId') userId: string) {
    return this.userService.makeSuperAdmin(userId);
  }

  @Patch(':id/make-admin')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Set user as admin (Super admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User promoted to admin' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  setAdmin(@Param('id') id: string) {
    return this.userService.setAdmin(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
