import { IsString } from 'class-validator';

export class OcrRequestDto {
  @IsString()
  documentType: string;
}
