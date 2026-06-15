import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIntervenantDto {
  @ApiProperty({ example: 'Ahmed Ferronnier' })
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'Ferronnier' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  trade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
