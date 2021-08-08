import { IsString } from 'class-validator'
import { MessageType } from 'src/constants'

export class GetMessagesDto {
  @IsString()
  fromUserId?: string;

  @IsString()
  toUserId?: string;

  @IsString()
  toGroupId?: string;

  @IsString()
  content?: string;

  @IsString()
  type?: MessageType;
}
