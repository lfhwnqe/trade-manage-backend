import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { CognitoService } from '../shared/services/cognito.service';
import { DynamodbService } from '../database/dynamodb.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private cognitoService: CognitoService,
    private dynamodbService: DynamodbService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    try {
      // This is a simplified validation - in production, you'd integrate with Cognito properly
      const user = await this.dynamodbService.get('users', {
        userId: username,
      });

      if (user && (await bcrypt.compare(password, user.password))) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      username: user.username,
      sub: user.userId,
      email: user.email,
      role: user.role || 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { username, email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.dynamodbService.get('users', {
      userId: username,
    });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DynamoDB
    const newUser = {
      userId: username,
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.dynamodbService.put('users', newUser);

    // Create user in Cognito (optional, for additional features)
    try {
      await this.cognitoService.createUser(username, email, password);
      await this.cognitoService.setUserPassword(username, password, true);
    } catch (error) {
      console.warn('Failed to create user in Cognito:', error.message);
    }

    const { password: _, ...userResponse } = newUser;
    return userResponse;
  }

  async getProfile(userId: string) {
    const user = await this.dynamodbService.get('users', { userId });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...profile } = user;
    return profile;
  }
}
