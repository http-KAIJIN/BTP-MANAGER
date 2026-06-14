import { PartialType } from '@nestjs/swagger';
import { CreateIntervenantDto } from './create-intervenant.dto';

export class UpdateIntervenantDto extends PartialType(CreateIntervenantDto) {}
