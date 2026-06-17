import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAiSettingsDto {
  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyBudget?: number;
}
