import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export type AiChatMessageRole = 'user' | 'assistant';

export class AiChatHistoryItem {
  @IsString()
  role: AiChatMessageRole;

  @IsString()
  content: string;
}

export class AiChatRequestDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiChatHistoryItem)
  history?: AiChatHistoryItem[];
}
