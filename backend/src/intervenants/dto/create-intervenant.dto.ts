import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIntervenantDto {
  @ApiProperty({ example: 'Ahmed Ferronnier' })
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ example: 'Ferronnier' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  trade: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
