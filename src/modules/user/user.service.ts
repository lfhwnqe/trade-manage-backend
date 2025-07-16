import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DynamodbService } from '../../database/dynamodb.service';
import { CognitoService } from '../../shared/services/cognito.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    private dynamodbService: DynamodbService,
    private cognitoService: CognitoService,
  ) {}

  async findAll() {
    return await this.dynamodbService.scan('users');
  }

  async findOne(userId: string) {
    const user = await this.dynamodbService.get('users', { userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string) {
    const users = await this.dynamodbService.query(
      'users',
      'email = :email',
      { ':email': email },
      'EmailIndex',
    );

    if (users.length === 0) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = users[0];
    return userWithoutPassword;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.dynamodbService.get('users', { userId });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    let updateExpression = 'SET #updatedAt = :updatedAt';
    const expressionAttributeNames = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues = {
      ':updatedAt': new Date().toISOString(),
    };

    // Build dynamic update expression
    Object.keys(updateUserDto).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpression += `, ${attrName} = ${attrValue}`;
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updateUserDto[key];
    });

    const updatedUser = await this.dynamodbService.update(
      'users',
      { userId },
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames,
    );

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.dynamodbService.get('users', { userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.email || !user.emailVerified) {
      throw new BadRequestException('Email not verified');
    }

    const match = await bcrypt.compare(dto.currentPassword, user.password);
    if (!match) {
      throw new BadRequestException('Invalid current password');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.cognitoService.setUserPassword(userId, dto.newPassword, true);

    await this.dynamodbService.update(
      'users',
      { userId },
      'SET #password = :password, #updatedAt = :updatedAt',
      {
        ':password': hashed,
        ':updatedAt': new Date().toISOString(),
      },
      { '#password': 'password', '#updatedAt': 'updatedAt' },
    );

    return { message: 'Password updated successfully' };
  }

  async remove(userId: string) {
    const existingUser = await this.dynamodbService.get('users', { userId });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.dynamodbService.delete('users', { userId });
    return { message: 'User deleted successfully' };
  }

  async makeSuperAdmin(userId: string) {
    // Check if another super admin already exists
    const allUsers = await this.dynamodbService.scan('users');
    const existing = allUsers.find((u) => u.role === 'super_admin');

    if (existing && existing.userId !== userId) {
      throw new BadRequestException('Super admin already exists');
    }

    const user = await this.dynamodbService.get('users', { userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.emailVerified) {
      throw new BadRequestException('Email not verified');
    }

    await this.dynamodbService.update(
      'users',
      { userId },
      'SET #role = :role, #updatedAt = :updatedAt',
      {
        ':role': 'super_admin',
        ':updatedAt': new Date().toISOString(),
      },
      { '#role': 'role', '#updatedAt': 'updatedAt' },
    );

    return { message: 'User promoted to super admin' };
  }

  async setAdmin(targetUserId: string) {
    const user = await this.dynamodbService.get('users', { userId: targetUserId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.dynamodbService.update(
      'users',
      { userId: targetUserId },
      'SET #role = :role, #updatedAt = :updatedAt',
      {
        ':role': 'admin',
        ':updatedAt': new Date().toISOString(),
      },
      { '#role': 'role', '#updatedAt': 'updatedAt' },
    );

    return { message: 'User promoted to admin' };
  }
}
