import { IsString, MinLength } from 'class-validator';

export class ReplyEscalationDto {
  @IsString()
  @MinLength(1)
  reply!: string;
}
