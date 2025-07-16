import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class InitSuperAdminDto {
  @ApiProperty({ description: 'Username of the user to promote' })
  @IsString()
  @IsNotEmpty()
  username: string;
}
