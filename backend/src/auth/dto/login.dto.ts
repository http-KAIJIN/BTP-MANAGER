import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@btp-manager.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, example: 'Admin@123456' })
  @IsString()
  @MinLength(8)
  password: string;
}
