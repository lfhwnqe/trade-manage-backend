import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamodbService } from '../../database/dynamodb.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private dynamodbService: DynamodbService) {}

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

  async remove(userId: string) {
    const existingUser = await this.dynamodbService.get('users', { userId });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.dynamodbService.delete('users', { userId });
    return { message: 'User deleted successfully' };
  }
}
