import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { CreateMaterialCatalogDto } from './create-material-catalog.dto';

export class UpdateMaterialCatalogDto extends PartialType(CreateMaterialCatalogDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentQty?: number;
}
