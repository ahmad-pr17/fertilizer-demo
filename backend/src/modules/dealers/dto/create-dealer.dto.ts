import { IsNumber, IsString, Min } from 'class-validator';

export class CreateDealerDto {
  @IsString()
  name!: string;

  @IsString()
  whatsappNumber!: string;

  @IsString()
  region!: string;

  @IsNumber()
  @Min(0)
  creditLimit!: number;

  @IsNumber()
  @Min(0)
  currentBalance!: number;
}
